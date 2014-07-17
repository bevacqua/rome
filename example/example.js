ripe(dt);
ripe(d, { time: false });
ripe(t, { date: false });

var api = ripe(ind);

toggle.addEventListener('click', function () {
  if (api.init) {
    api.init();
  } else {
    api.destroy();
  }
  toggle.innerHTML = api.init ? 'Restore <code>ripe</code> instance!' : 'Destroy <code>ripe</code> instance!';
});
