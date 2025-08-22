import { ServerResponse } from "http";
import { Client } from 'pg';
import * as core from "../../../core";
import { _Datetime, api, Fields, MetaModel, Model } from "../../../core";
import { setdefault } from "../../../core/api";
import { Dict } from "../../../core/helper";
import { WebRequest } from "../../../core/http";
import { dbConnect } from "../../../core/sql_db";
import { addDate, bool, config, extend, jsonParse, pop, stringify } from "../../../core/tools";

export const TIMEOUT = 50;

function hashable(key): string {
  if (Array.isArray(key)) {
    key = Array.from(key).join(',');
  }
  return String(key);
}

function channelWithDb(dbname, channel) {
  if (channel instanceof Model) {
    return [dbname, channel._name, channel.id];
  }
  if (typeof (channel) === 'string') {
    return [dbname, channel];
  }
  return channel;
}

class Event {
  constructor(target, args: [] = []) {

  }

  async start() {
    throw new Error("Method not implemented.");
  }

  set() {

  }
}

@MetaModel.define()
class ImBus extends Model {
  static _module = module;
  static _name = 'bus.bus';
  static _description = 'Communication Bus';

  static channel = Fields.Char('Channel');
  static message = Fields.Char('Message');

  @api.autovacuum()
  async _gcMessages() {
    const timeoutAgo = addDate(_Datetime.now(), { seconds: TIMEOUT * 2 });
    const domain = [['createdAt', '<', timeoutAgo]];
    return (await (await this.sudo()).search(domain)).unlink();
  }

  @api.model()
  async _sendmany(notifications) {
    const channels = new Set();
    const values = [];
    for (const [target, notificationType, message] of notifications) {
      const channel = channelWithDb(this.env.cr.dbName, target);
      channels.add(channel);
      values.push({
        'channel': JSON.stringify(channel),
        'message': JSON.stringify({
          'type': notificationType,
          'payload': message,
        })
      })
    }
    await (await this.sudo()).create(values);
    if (channels.size) {
      // We have to wait until the notifications are commited in database.
      // When calling 'NOTIFY imbus', some concurrent threads will be
      // awakened and will fetch the notification in the bus table. If the
      // transaction is not commited yet, there will be nothing to fetch,
      // and the longpolling will return no notification.
      this.env.cr.postcommit.add(
        async () => {
          const cr = dbConnect(config.get('dbDialect')).cursor();
          await cr.execute(`NOTIFY imbus, '%s'`, [stringify(Array.from(channels))]);
          await cr.close();
        }
      );
    }
  }

  @api.model()
  async _sendone(channel, notificationType, message) {
    await this._sendmany([[channel, notificationType, message]]);
  }

  @api.model()
  async _poll(channels, last = 0, options = null) {
    let domain;
    // first poll return the notification in the 'buffer'
    if (last == 0) {
      const timeoutAgo = addDate(_Datetime.now(), { seconds: TIMEOUT });
      domain = [['createdAt', '>', timeoutAgo]];
    }
    else {  // else returns the unread notifications
      domain = [['id', '>', last]];
    }
    channels = channels.map(c => String(channelWithDb(this.env.cr.dbName, c))); // Todo fix
    domain.push(['channel', 'in', channels]);
    const notifications = await (await this.sudo()).searchRead(domain);
    // list of notification to return
    const result = [];
    for (const notif of notifications) {
      result.push({
        'id': notif['id'],
        'message': JSON.parse(notif['message']),
      })
    }
    return result;
  }
}


//----------------------------------------------------------
// Dispatcher
//----------------------------------------------------------
class ImDispatch {
  channels: {};
  started: boolean;
  Event: any;

  constructor() {
    this.channels = {}
    this.started = false
    this.Event = null
  }

  async poll(req: WebRequest, res: ServerResponse, dbname, channels: any[], last, options: {} = {}, timeout: number = null) {
    channels = channels.map(channel => channelWithDb(dbname, channel));
    if (timeout == null) {
      timeout = TIMEOUT;
    }
    // Dont hang ctrl-c for a poll request, we need to bypass private
    // attribute access because we dont know before starting the thread that
    // it will handle a longpolling request
    {
      const env = req && await req.getEnv();
      env.daemonic = true;
      // rename the thread to avoid tests waiting for a longpolling
      env.label = `core.longpolling.request.${env.ident}`
    }

    const registry = await core.registry(dbname);

    // immediatly returns if past notifications exist
    const cr = registry.cursor();
    const env = await api.Environment.new(cr, global.SUPERUSER_ID);
    let notifications = await env.items('bus.bus')._poll(channels, last, options);
    await cr.close();

    // immediatly returns in peek mode
    if (options['peek']) {
      return Dict.from({ notifications, channels });
    }

    // or wait for future ones
    if (!bool(notifications)) {
      if (!this.started) {
        // Lazy start of events listener
        this.start();
      }

      const event = new this.Event();
      for (const channel of channels) {
        setdefault(this.channels, hashable(channel), new Set()).add(event);
      }
      try {
        event.wait(timeout);
        const cr = registry.cursor();
        const env = await api.Environment.new(cr, global.SUPERUSER_ID);
        notifications = await env.items('bus.bus')._poll(channels, last, options);
        await cr.close();
      } catch (e) {
        // timeout
        // pass
      }
      finally {
        // gc pointers to event
        for (const channel of channels) {
          const channelEvents: Set<any> = this.channels[hashable(channel)];
          if (bool(channelEvents) && event in channelEvents) {
            channelEvents.delete(event);
          }
        }
      }
    }
    return notifications;
  }

  /**
   * Dispatch postgres notifications to the relevant polling threads/greenlets
   */
  async loop() {
    console.info("Bus.loop listen imbus on db postgres");
    const conn = dbConnect(config.get('dbDialect'))
    const info = Object.assign({}, conn.info, {
      user: conn.info.username, // pg uses 'user', Sequelize uses 'username'
      ssl: false // pg not uses SSL in localhost
    });
    const client = new Client(info);

    // Connect to Postgres
    await client.connect();

    // while (! stopEvent.isSet()) {
    client.on('notification', async (msg) => {
      const channels = [];
      if (msg.payload) {
        extend(channels, jsonParse(msg.payload));
      }
      // dispatch to local threads/greenlets
      const events = new Set<Event>();
      for (const channel of channels) {
        const chns = pop(this.channels, hashable(channel), new Set());
        chns.forEach(e => events.add(e));
      }
      for (const event of events) {
        event.set();
      }
    });
    // }
    console.debug("LISTEN imbus");
    await client.query("LISTEN imbus");
  }

  async run() {
    this.loop();
  }

  start() {
    this.run();
    this.Event = Event;
    // new Event(name=f"{__name__}.Bus", target=self.run, daemon=true).start()
    this.started = true;
    return this;
  }
}

export const dispatch = new ImDispatch();