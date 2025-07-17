const brokerUrl = "wss://mqtt.flespi.io:443";
const topic = "savory/123";
const token = "aQ7335796TmUmkrXjMQdVb9RS369a0Mfto6ciG2MI9NWX2OQs3asmAWVDPjiwMuH";

const options = {
  username: token,
  password: "",
  reconnectPeriod: 2000,
};

const client = mqtt.connect(brokerUrl, options);

let history = [];
let lastBand = "";
let lastAntenna = "";
let bandChanges = 0;
let antennaChanges = 0;

// Gráfico
const ctx = document.getElementById('chart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      { label: 'RSSI', borderColor: 'blue', data: [] },
      { label: 'RSRP', borderColor: 'green', data: [] },
      { label: 'SINR', borderColor: 'orange', data: [] },
    ],
  },
  options: {
    responsive: true,
    scales: {
      x: { title: { display: true, text: 'Hora' } },
      y: { title: { display: true, text: 'Valor' } }
    }
  }
});

function updateSummary() {
  document.getElementById("band-changes").textContent = bandChanges;
  document.getElementById("antenna-changes").textContent = antennaChanges;
}

client.on("connect", () => {
  document.getElementById("status").innerHTML = "Estado: <span style='color:green'>Conectado</span>";
  client.subscribe(topic, (err) => {
    if (err) console.error("Suscripción fallida", err);
  });
});

client.on("message", (topic, message) => {
  const json = JSON.parse(message.toString());
  const now = new Date().toISOString();
  json.timestamp = now;

  // Guardar histórico
  history.push(json);

  // Cambios de banda
  if (lastBand && lastBand !== json.band_info) bandChanges++;
  lastBand = json.band_info;

  // Cambios de antena (Cell ID)
  if (lastAntenna && lastAntenna !== json.cell_id) antennaChanges++;
  lastAntenna = json.cell_id;

  updateSummary();

  // Mostrar JSON
  document.getElementById("json-output").textContent = JSON.stringify(json, null, 2);

  // Agregar al gráfico
  chart.data.labels.push(new Date().toLocaleTimeString());
  chart.data.datasets[0].data.push(json.rssi);
  chart.data.datasets[1].data.push(json.rsrp);
  chart.data.datasets[2].data.push(json.sinr);
  chart.update();
});

// Filtro por horario
document.getElementById("datetimePicker").addEventListener("change", (e) => {
  const selectedTime = new Date(e.target.value);
  const filtered = history.filter(d => new Date(d.timestamp).getHours() === selectedTime.getHours());

  if (filtered.length > 0) {
    chart.data.labels = filtered.map(d => new Date(d.timestamp).toLocaleTimeString());
    chart.data.datasets[0].data = filtered.map(d => d.rssi);
    chart.data.datasets[1].data = filtered.map(d => d.rsrp);
    chart.data.datasets[2].data = filtered.map(d => d.sinr);
    chart.update();
  }
});
