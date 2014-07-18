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

rome(mm, { min: '2013-12-30', max: '2014-10-01' });
rome(mmt, { min: '2014-04-30 19:45', max: '2014-09-01 08:30' });
