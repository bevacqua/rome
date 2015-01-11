# 1.2.4 Tunnel Vision

- Fixed [an issue](https://github.com/bevacqua/rome/issues/30) where `autoHideOnBlur` wouldn't work on Firefox

# 1.2.3 Park Bully

- Fixed an issue where you couldn't navigate months if the calendar was out of range

# 1.2.2 Fill Form at the Counter

- Added ability to change weekdays format

# 1.2.1 Time Matters

- Changed navigation buttons to `button` type

# 1.2.0 Week Starts

- Changed `weekStart` default value to `moment().weekday(0).day()`

# 1.1.6 Warner Brothers

- Circumvented a deprecation warning from `moment`

# 1.1.5 Moment of Truth

- Bumped `moment` to `v2.8.2`

# 1.1.4 Show Time

- API methods now allow for chaining even when the operation is a no-op
- Fixed an issue ([#27][4]) where inline calendars wouldn't get positioned using the `.show` API method
- Created a `'show'` event, emitted whenever the calendar is displayed
- Created a `'hide'` event, emitted whenever the calendar is hidden

# 1.1.3 Time Sieve

- Fixed an issue ([#25][3]) which prevented you from using `min` and `max` when `date` is `false`

# 1.1.2 Internet Savvy

- Fixed an issue in old IE browsers

# 1.1.1 First Date

- Fixed an issue where date validation resulted in the wrong dates being disabled

# 1.1.0 Calendar Press

- Introduced ability to display months side-by-side in a single calendar

# 1.0.3 Happy Pony

- Fixed issues when setting an initial value on calendars that also validate their inputs

# 1.0.2 Clock Tick

- Fixed a bug where you couldn't set `appendTo: 'parent'` for calendar associated to input fields

# 1.0.1 Wasteland

- Fixed a bug where calendars would be cached but never found again
- `rome.find` returns `null` if no calendar is found

# 1.0.0 Roman Empire

- Fixed an issue where tapping the input field wouldn't re-open the calendar on mobile ([fb8fc070][2])

# 0.14.0 Rome For Export

- Fixed an issue where the standalone version didn't export an API

# 0.13.0 Dora the Explorer

- Fixed `scrollTop` issues in IE8
- Fixed click-to-hide issues in IE8
- Improved demo conformance by adding a `DOCTYPE`
- When destroying a calendar, API methods become a no-op instead of getting deleted

# 0.12.1 Dig Deeper

- Fixed internal clone method

# 0.12 Internet Surfer

- Fixed a myriad of issues in IE8, enabling basic support

# 0.11.2 King of Sweaters

- Fixed an issue where reference errors occured when setting an `initialValue` or an `input`'s `value`

# 0.11.1 Unthrown Exception

- Introduced `except` and `only` validators

# 0.11.0 Refurbished Products

- Refactored validator factories so that the consumer doesn't need to bind `'data'` events to `refresh` inline calendars

# 0.10.0 Brand Management

- Renamed validator factories

# 0.9.0 Factory Unlocked

- Calendars are rendered when shown
- Validation occurs whenever a calendar is shown
- Fixed a bug where inline calendars couldn't be retrieved with `rome.find`
- Introduced validator factories for common date comparison use cases
- Introduced `calendar.refresh` method to refresh a calendar on demand

# 0.8.1 Market Positioning

- Fixed a bug where positioning would fail if the container had `position: relative`

# 0.8.0 Small Contraption

- Replaced `contra` with `contra.emitter`, shaving bytes

# 0.7.1 Treasure Goblin

- `rome.find` operates on both inputs and inline calendars
- Fixed a minor bug when showing and hiding calendars on `'ready'`

# 0.6.1 Diminishing Returns

- Where possible, API methods return the Rome instance for chaining

# 0.6.0 Moving Target

- Merged `rome.inline` with `rome(elem, options?)`

# 0.5.0 Split Second

- Changed the way how `moment` should be passed to `rome`, because architecture
- Introduced ability to set an `initialValue` for the calendar
- Published internal method `setValue(value)` to set a date on the calendar
- Published internal method `emitValues()` to emit data through the calendar
- Initialization happens in the next frame, meaning you can easily listen for `'ready'` events
- Split functionality between calendar and input field
  - Ability to create inline calendars that don't depend on an input field
  - Original method doesn't change its public API

# 0.4.2 Time Frame

- Fixed an issue where the date _closest to an invalid one_ wouldn't be selected

# 0.4.0 Tinder

- Introduced `dateValidator` and `timeValidator` options

# 0.3.14 Foo Fighters

- Fixed an issue when `required` was set to `false`

# 0.3.12 Optional Overload

- Published alternative distribution `rome.standalone.js` which doesn't bundle `moment`
- Implemented `required` option that allows the input field to be cleared

# 0.3.11 Time Obsession

- Fixed a bug where the calendar would break if `time` was set to `false`

# 0.3.10 Texas Ranger

- Fixed a bug where you weren't able to navigate to the month if it was visible in the current calendar view

# 0.3.9 Day of the Week

- Implemented `weekStart` to choose the starting day of the week

# 0.3.8 Kamasutra

- Made it easier to overwrite the absolute positioning of the calendar by only setting it once, on the stylesheet

# 0.3.6 Web Starter Kit

- Fixed a bug where closing the calendar, with the time list open, triggered a rendering bug in WebKit [(952e714)][1]

# 0.3.5 Pick Up

- Cloned options objects return proper clones of the `min` and `max` moments instead of references

# 0.3.1 Pack Up

- Consumer only gets copies of the configuration object, never the original
- Introduced `.options.reset()` to reset options to their default values like `.options()` used to do

Changes

- `.options()` API changed, now returns copy of options if no arguments are provided

# 0.2.8 Shower Time

- Fixed a bug where the calendar wasn't being absolutely positioned

# 0.2.7 Cat Trap

- Fixed bug when setting `appendTo: 'parent'`

# 0.2.6 Mouse Trap

- Fixed support for `min` and `max` time settings

# 0.2.5 Cat and Mouse

- Added the ability to choose a minimum date
- Added the ability to choose a maximum date
- Added the ability to click on days in neighboring months

# 0.2.0 IPO

- Initial Public Release

[1]: https://github.com/bevacqua/rome/commit/952e714b4e818bd6261621b53fe1f24c01aeba96
[2]: https://github.com/bevacqua/rome/commit/fb8fc070fd4bc8b49009bff4b34c1b904f80a025
[3]: https://github.com/bevacqua/rome/issues/25
[4]: https://github.com/bevacqua/rome/issues/27
