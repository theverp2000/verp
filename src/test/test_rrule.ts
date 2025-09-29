import { datetime, RRule, RRuleSet, rrulestr } from 'rrule'

function test() {
  // Create a rule:
  const rule = new RRule({
    freq: RRule.DAILY,
    // interval: 1,
    byweekday: 3,
    dtstart: new Date(2025, 4, 30, 8, 0),
    until: new Date(2025, 5, 1)
  })

  // Get all occurrence dates (Date instances):
  const days = rule.all();
  for (const day of days) {
    console.log(day);
  }

  // Get a slice:
  // rule.between(datetime(2012, 8, 1), datetime(2012, 9, 1))

  // Get an iCalendar RRULE string representation:
  // The output can be used with RRule.fromString().
  console.log(rule.toString())
  // "DTSTART:20120201T093000Z\nRRULE:FREQ=WEEKLY;INTERVAL=5;UNTIL=20130130T230000Z;BYDAY=MO,FR"

  // Get a human-friendly text representation:
  // The output can be used with RRule.fromText().
  // console.log(rule.toText())
  // "every 5 weeks on Monday, Friday until January 31, 2013"
}

test()