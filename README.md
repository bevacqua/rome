# rome

> Dependency free, opt-in UI, customizable date _(and time)_ picker!

#### Demo!

You can [see a live demo here][3].

[![screenshot.png][4]][3]

## Install

From npm or Bower.

```shell
npm install --save rome
```

```shell
bower install --save rome
```

Note that if you're using the standalone version, the API is published under the `rome` global. If you're using CJS, then you'll have to `require('rome')`.

## API

The API in `rome` exposes two methods.

### `rome.find(input)`

Finds a previously created Rome calendar. Exactly the same as doing `rome(input)` after the first time. The difference is that if the first call made on an input is `.find` you'll get `undefined`, and if the first call is `rome` then a Rome calendar will be created and associated to the input. This association can't be undone even by `.destroy()`-ing the `rome` instance, which can be `.restore()`-d later.

### `rome(input, options?)`

Creates a Rome calendar using a ton of options. These have reasonable defaults that are easy to adjust, too. The options are listed below.

Option            | Description
------------------|--------------------------------------------------------------------------------------------------
`autoHideOnClick` | Hides the calendar when clicking away
`appendTo`        | DOM element where the calendar will be appended to
`autoClose`       | Closes the calendar when picking a day or a time
`autoHideOnBlur`  | Hides the calendar when focusing something other than the input field
`date`            | The calendar shows days and allows you to navigate between months
`dayFormat`       | Format string used to display days on the calendar
`inputFormat`     | Format string used for the input field as well as the results of `rome`
`invalidate`      | Ensures the date is valid when the field is blurred
`monthFormat`     | Format string used by the calendar to display months and their year
`styles`          | CSS classes applied to elements on the calendar
`time`            | The calendar shows the current time and allows you to change it using a dropdown
`timeFormat`      | Format string used to display the time on the calendar
`timeInterval`    | Seconds between each option in the time dropdown

#### Default Options

If you don't set an option, the default will be used. You can [look up the defaults here][1], or below.

```json
{
  "autoHideOnClick": true,
  "appendTo": document.body,
  "autoClose": true,
  "autoHideOnBlur": true,
  "date": true,
  "dayFormat": "DD",
  "inputFormat": "YYYY-MM-DD HH:mm",
  "invalidate": true,
  "monthFormat": "MMMM YYYY",
  "styles": {,
    "back": "rd-back",
    "container": "rd-container",
    "date": "rd-date",
    "dayBody": "days-body",
    "dayBodyElem": "day-body",
    "dayDisabled": "day-disabled",
    "dayHead": "days-head",
    "dayHeadElem": "day-head",
    "dayRow": "days-row",
    "dayTable": "rd-days",
    "month": "rd-month",
    "next": "rd-next",
    "selectedDay": "day-selected",
    "selectedTime": "time-selected",
    "time": "rd-time",
    "timeList": "time-list",
    "timeOption": "time-option"
  },
  "time": true,
  "timeFormat": "HH:mm",
  "timeInterval": 1800
}
```

#### Rome API

When you create a calendar with `rome(input)`, you'll get a `cal` instance back. This has a few API methods.

##### `.show()`

Shows the calendar by absolutely positioning it right below the input field.

##### `.hide()`

Hides the calendar.

##### `.container`

The DOM element that contains the calendar.

##### `.input`

The input field assigned to this calendar instance.

##### `.getDate()`

Returns the current date, as defined by the calendar, in a native `Date` object.

##### `.getDateString(format?)`

Returns the current date, as defined by the calendar, using the provided `options.inputFormat` format string or a format of your choosing.

##### `.getMoment()`

Returns a copy of the `moment` object underlying the current date in the calendar.

##### `.destroy()`

Removes the calendar from the DOM and all of its associated DOM event listeners. The API is reduced to provide only the `.restore` method described below.

##### `.restore(options?)`

Restores the calendar, using the provided options (or the default options). The associated input field can't be changed.

##### `.options(options?)`

Destroys the calendar and initializes it with the provided options. Effectively the same as calling `.restore(options?)` immediately after calling `.destroy()`.

#### Events

Rome calendars also provide a few events you can subscribe to. These events are published through an event emitter created using [`contra`][2]. These events are listed below.

Event       | Arguments   | Description
------------|-------------|------------
`ready`     | `[options]` | The calendar has been `.restore`-d.
`destroyed` | `[]`        | The calendar has been `.destroy`-ed.
`data`      | `[value]`   | The date may have been updated by the calendar. Value of `.getDateString()` is provided.
`year`      | `[year]`    | The year may have been updated by the calendar. Value of `moment.year()` is provided.
`month`     | `[month]`   | The month may have been updated by the calendar. Value of `moment.month()` is provided.
`day`       | `[day]`     | The day may have been updated by the calendar. Value of `moment.date()` is provided.
`time`      | `[time]`    | The time may have been updated by the calendar. Formatted time string is provided.

## License

MIT

[1]: https://github.com/bevacqua/rome/blob/master/src/defaults.js
[2]: https://github.com/bevacqua/contra
[3]: https://bevacqua.github.io/rome
[4]: https://cloud.githubusercontent.com/assets/934293/3627112/a635c562-0e85-11e4-8b57-2ec2d8be9af2.png
