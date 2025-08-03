async function updateProgress() {
  const res = await fetch('/progress');
  const data = await res.json();

  const porcentaje = Math.floor((data.paid / data.total) * 100);
  document.getElementById('progress-bar').style.width = `${porcentaje}%`;

  document.getElementById('progress-text').innerText =
    `$${data.paid.toLocaleString()} / $${data.total.toLocaleString()}`;
}

updateProgress();
