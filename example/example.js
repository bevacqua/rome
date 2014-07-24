var moment = rome.moment;

rome(dt);
rome(sm, { weekStart: 1 });
rome(d, { time: false });
rome(t, { date: false });

var picker = rome(ind);

toggle.addEventListener('click', function () {
  if (picker.restore) {
    picker.restore();
  } else {
    picker.destroy();
  }
  toggle.innerHTML = picker.restore ? 'Restore <code>rome</code> instance!' : 'Destroy <code>rome</code> instance!';
});

rome(mm, { min: '2013-12-30', max: '2014-10-01' });
rome(mmt, { min: '2014-04-30 19:45', max: '2014-09-01 08:30' });

rome(iwe, {
  dateValidator: function (d) {
    return moment(d).day() !== 6;
  }
});

rome(win, {
  dateValidator: function (d) {
    var m = moment(d);
    var y = m.year();
    var f = 'MM-DD';
    var start = moment('12-21', f).year(y).startOf('day');
    var end = moment('03-19', f).year(y).endOf('day');
    return m.isBefore(start) && m.isAfter(end);
  }
});

rome(tim, {
  timeValidator: function (d) {
    var m = moment(d);
    var start = m.clone().hour(12).minute(59).second(59);
    var end = m.clone().hour(18).minute(0).second(1);
    return m.isAfter(start) && m.isBefore(end);
  }
});

rome( rngStart, {
  time: false,
  dateValidator: function( startDate ){
    var endDate = rngEnd && rome.find(rngEnd) && rome.find(rngEnd).getDate && rome.find(rngEnd).getDate();
    if( ! startDate || ! endDate ) {
      return;
    }
    return startDate <= endDate;
  }
} );
rome( rngEnd, {
  time: false,
  dateValidator: function( endDate ){
    var startDate = rngStart && rome.find(rngStart) && rome.find(rngStart).getDate && rome.find(rngStart).getDate();
    if( ! startDate || ! endDate ) {
      return;
    }
    return startDate <= endDate;
  }
} );

rome(inl).on('data', function (value) {
  inlv.innerText = value;
});
