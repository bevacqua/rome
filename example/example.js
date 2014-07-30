rome(dt);
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

rome(mmd, { min: '2013-12-30', max: '2014-10-01', time: false, disallow: ['2014-01-15']});
rome(mmt, { min: '2014-04-30 19:45', max: '2014-09-01 08:30', disallow: ['2014-05-15 09:00'] });
