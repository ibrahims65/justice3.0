document.getElementById('searchForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = e.target.query.value;
  const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
  const data = await res.json();

  const container = document.getElementById('searchResults');
  container.innerHTML = data.results.map(r => `
    <div class="border p-2 mb-2">
      <strong>${r.name}</strong> — ${r.id}
      <a href="/person/${r.id}" class="text-blue-600 ml-2">View</a>
    </div>
  `).join('');
});
