import PO from 'pofile';

async function poload(fileName): Promise<PO> {
  return new Promise((resolve, reject) => {
    PO.load(fileName, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    })
  });
}

async function localWebTranslations(transFile) {
  const messages: any[] = [];
  let po: PO;
  try {
    po = await poload(transFile);
  } catch (e) {
    return
  }
  /**
   * item = {
      msgid: "\n\nAccounting reports ...\n\n    ",
      msgctxt: null,
      comments: [
      ],
      extractedComments: [
        "module: base",
      ],
      references: [
        "model:ir.module.module,description:base.module_l10n_at_reports",
      ],
      msgid_plural: null,
      msgstr: [
        "\n\nAccounting reports ...\n\n    ",
      ],
      flags: {
      },
      obsolete: false,
      nplurals: 1,
    }
   */
  for (const x of po.items) {
    if (x.msgid && x.msgstr && x.comments.includes("verp-web")) {
      messages.push({ 'id': x.msgid, 'string': x.msgstr });
    }
  }
  return messages;
}

const file = __dirname + '/vi.po';

localWebTranslations(file);