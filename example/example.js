ripe(dt);
ripe(d, { time: false });
ripe(t, { date: false });

var picker = ripe(ind);

toggle.addEventListener('click', function () {
  if (picker.restore) {
    picker.restore();
  } else {
    picker.destroy();
  }
  toggle.innerHTML = picker.restore ? 'Restore <code>ripe</code> instance!' : 'Destroy <code>ripe</code> instance!';
});
