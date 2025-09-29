import * as luxon from 'luxon';

/*
in javascript
>>> n = now()
datetime.datetime(2024, 6, 12, 8, 24, 32, 402415)

>>> timezone('UTC').localize(n)
datetime.datetime(2024, 6, 12, 8, 24, 32, 402415, tzinfo=<UTC>)

>>> timezone('UTC').localize(n).astimezone(timezone('Asia/Bangkok'))  
datetime.datetime(2024, 6, 12, 15, 24, 32, 402415, tzinfo=<DstTzInfo 'Asia/Bangkok' +07+7:00:00 STD>)

>>> timezone('Asia/Bangkok').localize(n)                             
datetime.datetime(2024, 6, 12, 8, 24, 32, 402415, tzinfo=<DstTzInfo 'Asia/Bangkok' +07+7:00:00 STD>)
*/

function standard() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  console.log(date);//Date: "2022-12-05T17:00:00.000Z"
  console.log(date.toString())//"Tue Dec 06 2022 00:00:00 GMT+0700 (Indochina Time)" 
  console.log(date.toDateString())//"Tue Dec 06 2022" 
  console.log(date.toTimeString())//"06:16:34 GMT+0700 (Indochina Time)" 
  console.log(date.toISOString())//"2022-12-05T17:00:00.000Z"
  console.log(date.toUTCString())//"Mon, 05 Dec 2022 17:00:00 GMT"
  console.log(date.toLocaleString())//"12/6/2022, 12:00:00 AM"
  console.log(date.toLocaleDateString())//"12/6/2022" 
  console.log(date.toLocaleTimeString());//"12:00:00 AM" 
  console.log(date.getTimezoneOffset());//-429
  console.log(Intl.DateTimeFormat().resolvedOptions()) //'Asia/Saigon'
  // {
  //   locale: 'en-US',
  //   calendar: 'gregory',
  //   numberingSystem: 'latn',
  //   timeZone: 'Asia/Saigon',
  //   year: 'numeric',
  //   month: 'numeric',
  //   day: 'numeric'
  // }
  console.log(Intl.NumberFormat().resolvedOptions())
  // {
  //   locale: 'en-US',
  //   numberingSystem: 'latn',
  //   style: 'decimal',
  //   minimumIntegerDigits: 1,
  //   minimumFractionDigits: 0,
  //   maximumFractionDigits: 3,
  //   useGrouping: true,
  //   notation: 'standard',
  //   signDisplay: 'auto'
  // }
  console.log(new Intl.RelativeTimeFormat().resolvedOptions)
  const regionNamesInEnglish = new Intl.DisplayNames(['vi-VN'], { type: "region" });
  console.log(regionNamesInEnglish.of('JP'), regionNamesInEnglish.resolvedOptions());
  // Nhật Bản { locale: 'vi-VN', style: 'long', type: 'region', fallback: 'code' }
}

function _luxon() {
  // const date = luxon.DateTime.now();
  // console.log(date);
  // console.log(date.toLocal());
  // console.log(date.toLocaleString());
  // console.log(luxon.DateTime.fromISO("2017-05-15T09:10:23", { zone: "Europe/Paris" }));

  const DateTime = luxon.DateTime;
  const Duration = luxon.Duration;
  const Interval = luxon.Interval;
  const dd = new Date(); dd.getDate
  const d2 = DateTime.fromMillis(dd.valueOf(), {zone: 'America/New_York'});
  const now = DateTime.now();
  const local = DateTime.local();

  // > new Date()
  // 2024-04-22T08:10:38.873Z
  // > new Date().toLocaleString()
  // '4/22/2024, 3:10:40 PM' # 08+GMT7 = 8 + 7 = 15 = 3pm
  // > luxon.DateTime.now()
  // DateTime { ts: 2024-04-22T15:04:25.332+07:00, zone: Asia/Bangkok, locale: en-US }
  // > luxon.DateTime.local()
  // DateTime { ts: 2024-04-22T15:04:34.005+07:00, zone: Asia/Bangkok, locale: en-US }
  // > luxon.DateTime.local({ zone: "America/New_York" })
  // DateTime { ts: 2024-04-22T04:07:40.761-04:00, zone: America/New_York, locale: en-US }
  // > luxon.DateTime.local(2017)
  // DateTime { ts: 2017-01-01T00:00:00.000+07:00, zone: Asia/Bangkok, locale: en-US }
  // > luxon.DateTime.local(2017, { zone: "America/New_York" })
  // DateTime { ts: 2017-01-01T00:00:00.000-05:00, zone: America/New_York, locale: en-US }

  console.log(now);
  const iToday = Interval.fromDateTimes(now.startOf('day'), now.endOf('day'));
  const iPast = Interval.fromISO("2018-04-01/2018-08-01");
  const iFuture = Interval.fromISO("2018-08-01/2018-08-01");
  const i= Interval.after(now, {years: 5});
  const j= Interval.after(local, {years: 5});
  console.log(i.end, j.end);

  const iUnion = iToday.union(iPast);//, iFuture);
  console.log(iPast.overlaps(iToday));

  //console.log(Interval.merge([undefined, undefined].filter(v=>v)));
  //console.log(Interval.xor([iToday,iPast]).map(v=>v.toString()));
  console.log(Interval.invalid(now.toString()));

  const d = Duration.fromObject({years: 5});
  DateTime.now().plus(d)
  /**
    Duration {
      values: { years: 1 },
      loc: Locale {
        locale: 'en-US',
        numberingSystem: null,
        outputCalendar: null,
        intl: 'en-US',
        weekdaysCache: { format: {}, standalone: {} },
        monthsCache: { format: {}, standalone: {} },
        meridiemCache: null,
        eraCache: {},
        specifiedLocale: null,
        fastNumbersCached: null
      },
      conversionAccuracy: 'casual',
      invalid: null,
      matrix: {
        years: {
          quarters: 4,
          months: 12,
          weeks: 52,
          days: 365,
          hours: 8760,
          minutes: 525600,
          seconds: 31536000,
          milliseconds: 31536000000
        },
        quarters: {
          months: 3,
          weeks: 13,
          days: 91,
          hours: 2184,
          minutes: 131040,
          seconds: 7862400,
          milliseconds: 7862400000
        },
        months: {
          weeks: 4,
          days: 30,
          hours: 720,
          minutes: 43200,
          seconds: 2592000,
          milliseconds: 2592000000
        },
        weeks: {
          days: 7,
          hours: 168,
          minutes: 10080,
          seconds: 604800,
          milliseconds: 604800000
        },
        days: {
          hours: 24,
          minutes: 1440,
          seconds: 86400,
          milliseconds: 86400000
        },
        hours: { minutes: 60, seconds: 3600, milliseconds: 3600000 },
        minutes: { seconds: 60, milliseconds: 60000 },
        seconds: { milliseconds: 1000 }
      },
      isLuxonDuration: true
    }
   */
}

function _test() {
  const timestamp = new Date();
  console.log(timestamp);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const userDate = luxon.DateTime.fromISO(timestamp.toISOString(), {zone: tz}).toUTC();
  console.log(userDate.toJSDate());
}

// function timezones() {
//   var aryIanaTimeZones = Intl.supportedValuesOf('timeZone');
//   let date = new Date;
//   aryIanaTimeZones.forEach((timeZone) =>
//   {
//     let strTime = date.toLocaleString("en-US",{timeZone: `${timeZone}`});
//     console.log(timeZone, strTime);
//   });
// }

// standard();
// _luxon();
// timezones();

export { };
