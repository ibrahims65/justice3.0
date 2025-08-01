document.getElementById('searchForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = e.target.query.value;
  const container = document.getElementById('searchResults');
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }
    const results = await res.json();

    container.innerHTML = results.map(r => `
      <div class="border p-2 mb-2">
        <strong>${r.label}</strong>
        <a href="${r.url}" class="text-blue-600 ml-2">View</a>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error fetching search results:', error);
    container.innerHTML = '<p class="p-4 text-red-500">Error loading results.</p>';
  }
});
