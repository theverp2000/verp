Some Luxon examples
This is not meant to be a comprehensive showcase of Luxon's capabilities, just a quick flavoring.

Info.features()	//=>	{"relative":true}
DateTime.now()	//=>	[ DateTime 2023-02-01T17:35:28.524+07:00 ]
DateTime.now().toUnixInteger()	//=>	1675247728
DateTime.now().toJSDate()	//=>	[ Date Wed Feb 01 2023 17:35:28 GMT+0700 (Indochina Time) ]
DateTime.utc().toISO()	//=>	"2023-02-01T10:35:28.546Z"
DateTime.utc(2017, 5, 15, 17, 36)	//=>	[ DateTime 2017-05-15T17:36:00.000Z ]
DateTime.utc(2017, 5, 15, 17, 36).toLocal()	//=>	[ DateTime 2017-05-16T00:36:00.000+07:00 ]
DateTime.local(2017, 5, 15, 17, 36)	//=>	[ DateTime 2017-05-15T17:36:00.000+07:00 ]
DateTime.local(2017, 5, 15, 17, 36).toUTC()	//=>	[ DateTime 2017-05-15T10:36:00.000Z ]
DateTime.now().toObject()	//=>	{"year":2023,"month":2,"day":1,"hour":17,"minute":35,"second":28,"millisecond":547}
DateTime.fromObject({ year: 2017, month: 5, day: 15, hour: 17, minute: 36 })	//=>	[ DateTime 2017-05-15T17:36:00.000+07:00 ]
DateTime.fromObject({ year: 2017, month: 5, day: 15, hour: 17, minute: 36 }, { zone: 'America/New_York' })	//=>	[ DateTime 2017-05-15T17:36:00.000-04:00 ]
DateTime.fromObject({ year: 2017, month: 5, day: 15, hour: 17, minute: 36 }, { zone: 'Asia/Singapore' })	//=>	[ DateTime 2017-05-15T17:36:00.000+08:00 ]
DateTime.now().setZone('America/New_York')	//=>	[ DateTime 2023-02-01T05:35:28.811-05:00 ]
DateTime.now().setZone('America/New_York').startOf('day')	//=>	[ DateTime 2023-02-01T00:00:00.000-05:00 ]
DateTime.now().plus({minutes: 15, seconds: 8})	//=>	[ DateTime 2023-02-01T17:50:36.812+07:00 ]
DateTime.now().plus({days: 6})	//=>	[ DateTime 2023-02-07T17:35:28.813+07:00 ]
DateTime.now().minus({days: 6})	//=>	[ DateTime 2023-01-26T17:35:28.813+07:00 ]
DateTime.now().diff(DateTime.local(1982, 5, 25)).milliseconds	//=>	1284140128814
DateTime.now().diff(DateTime.local(1982, 5, 25), 'days').days	//=>	14862.732972395834
DateTime.now().diff(DateTime.local(1982, 5, 25), ['days', 'hours'])	//=>	[ Duration {"days":14862,"hours":17.591337777777778} ]
DateTime.now().toLocaleString()	//=>	"2/1/2023"
DateTime.now().setLocale('zh').toLocaleString()	//=>	"2023/2/1"
DateTime.now().toLocaleString(DateTime.DATE_MED)	//=>	"Feb 1, 2023"
DateTime.now().setLocale('zh').toLocaleString(DateTime.DATE_MED)	//=>	"2023年2月1日"
DateTime.now().setLocale('fr').toLocaleString(DateTime.DATE_FULL)	//=>	"1 février 2023"
DateTime.fromISO('2017-05-15')	//=>	[ DateTime 2017-05-15T00:00:00.000+07:00 ]
DateTime.fromISO('2017-05-15T17:36')	//=>	[ DateTime 2017-05-15T17:36:00.000+07:00 ]
DateTime.fromISO('2017-W33-4')	//=>	[ DateTime 2017-08-17T00:00:00.000+07:00 ]
DateTime.fromISO('2017-W33-4T04:45:32.343')	//=>	[ DateTime 2017-08-17T04:45:32.343+07:00 ]
DateTime.fromFormat('12-16-2017', 'MM-dd-yyyy')	//=>	[ DateTime 2017-12-16T00:00:00.000+07:00 ]
DateTime.now().toFormat('MM-dd-yyyy')	//=>	"02-01-2023"
DateTime.now().toFormat('MMMM dd, yyyy')	//=>	"February 01, 2023"
DateTime.now().setLocale('fr').toFormat('MMMM dd, yyyy')	//=>	"février 01, 2023"
DateTime.fromFormat('May 25, 1982', 'MMMM dd, yyyy')	//=>	[ DateTime 1982-05-25T00:00:00.000+07:00 ]
DateTime.fromFormat('mai 25, 1982', 'MMMM dd, yyyy', { locale: 'fr' })	//=>	[ DateTime 1982-05-25T00:00:00.000+07:00 ]
DateTime.now().plus({ days: 1 }).toRelativeCalendar()	//=>	"tomorrow"
DateTime.now().plus({ days: -1 }).toRelativeCalendar()	//=>	"last month"
DateTime.now().plus({ months: 1 }).toRelativeCalendar()	//=>	"next month"
DateTime.now().setLocale('fr').plus({ days: 1 }).toRelativeCalendar()	//=>	"demain"
DateTime.now().setLocale('fr').plus({ days: -1 }).toRelativeCalendar()	//=>	"le mois dernier"
DateTime.now().setLocale('fr').plus({ months: 1 }).toRelativeCalendar()	//=>	"le mois prochain"

Standalone token	Format token	Description	Example
S		  millisecond, no padding	54
SSS		millisecond, padded to 3	054
u		  fractional seconds, functionally identical to SSS	054
uu		fractional seconds, between 0 and 99, padded to 2	05
uuu		fractional seconds, between 0 and 9	0
s		  second, no padding	4
ss		second, padded to 2 padding	04
m		  minute, no padding	7
mm		minute, padded to 2	07
h		  hour in 12-hour time, no padding	1
hh		hour in 12-hour time, padded to 2	01
H		  hour in 24-hour time, no padding	9
HH		hour in 24-hour time, padded to 2	13
Z		  narrow offset	+5
ZZ		short offset	+05:00
ZZZ		techie offset	+0500
ZZZZ	abbreviated named offset	EST
ZZZZZ	unabbreviated named offset	Eastern Standard Time
z		  IANA zone	America/New_York
a		  meridiem	AM
d		  day of the month, no padding	6
dd		day of the month, padded to 2	06
c	E	  day of the week, as number from 1-7 (Monday is 1, Sunday is 7)	3
ccc	EEE	day of the week, as an abbreviate localized string	Wed
cccc	EEEE	day of the week, as an unabbreviated localized string	Wednesday
ccccc	EEEEE	day of the week, as a single localized letter	W
L	M	  month as an unpadded number	8
LL	MM	month as a padded number	08
LLL	MMM	month as an abbreviated localized string	Aug
LLLL	MMMM	month as an unabbreviated localized string	August
LLLLL	MMMMM	month as a single localized letter	A
y		  year, unpadded	2014
yy		two-digit year	14
yyyy	four- to six- digit year, pads to 4	2014
G		  abbreviated localized era	AD
GG		unabbreviated localized era	Anno Domini
GGGGG	one-letter localized era	A
kk		ISO week year, unpadded	14
kkkk	ISO week year, padded to 4	2014
W		  ISO week number, unpadded	32
WW		ISO week number, padded to 2	32
ii		Local week year, unpadded	14
iiii	Local week year, padded to 4	2014
n		  Local week number, unpadded	32
nn		Local week number, padded to 2	32
o		  ordinal (day of year), unpadded	218
ooo		ordinal (day of year), padded to 3	218
q		  quarter, no padding	3
qq		quarter, padded to 2	03
D		  localized numeric date	9/4/2017
DD		localized date with abbreviated month	Aug 6, 2014
DDD		localized date with full month	August 6, 2014
DDDD	localized date with full month and weekday	Wednesday, August 6, 2014
t		  localized time	9:07 AM
tt		localized time with seconds	1:07:04 PM
ttt		localized time with seconds and abbreviated offset	1:07:04 PM EDT
tttt	localized time with seconds and full offset	1:07:04 PM Eastern Daylight Time
T		  localized 24-hour time	13:07
TT		localized 24-hour time with seconds	13:07:04
TTT		localized 24-hour time with seconds and abbreviated offset	13:07:04 EDT
TTTT	localized 24-hour time with seconds and full offset	13:07:04 Eastern Daylight Time
f		  short localized date and time	8/6/2014, 1:07 PM
ff		less short localized date and time	Aug 6, 2014, 1:07 PM
fff		verbose localized date and time	August 6, 2014, 1:07 PM EDT
ffff	extra verbose localized date and time	Wednesday, August 6, 2014, 1:07 PM Eastern Daylight Time
F		  short localized date and time with seconds	8/6/2014, 1:07:04 PM
FF		less short localized date and time with seconds	Aug 6, 2014, 1:07:04 PM
FFF		verbose localized date and time with seconds	August 6, 2014, 1:07:04 PM EDT
FFFF	extra verbose localized date and time with seconds	Wednesday, August 6, 2014, 1:07:04 PM Eastern Daylight Time
X		  unix timestamp in seconds	1407287224
x		  unix timestamp in milliseconds	1407287224054

python
LTY  : 'MM/DD HH:mm',   // format for new token
LTS  : 'h:mm:ss A',
LT   : 'h:mm A',
L    : 'MM/DD/YYYY',
LL   : 'MMMM D, YYYY',
LLL  : 'MMMM D, YYYY h:mm A',
LLLL : 'dddd, MMMM D, YYYY h:mm A'