# 0.3.3 Pick Up

- Cloned options objects return proper clones of the `min` and `max` moments instead of references.

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
