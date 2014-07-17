ripe(dt);
ripe(d, { time: false });
ripe(t, { date: false });

var picker = ripe(ind);

toggle.addEventListener('click', function () {
  if (picker.init) {
    picker.init();
  } else {
    picker.destroy();
  }
  toggle.innerHTML = picker.init ? 'Restore <code>ripe</code> instance!' : 'Destroy <code>ripe</code> instance!';
});
