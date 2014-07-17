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
