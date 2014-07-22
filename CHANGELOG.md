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
