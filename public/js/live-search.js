document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('live-search');
  const searchResults = document.getElementById('search-results');
  const searchResultsContainer = document.getElementById('search-results-container');

  if (searchInput) {
    searchInput.addEventListener('input', async (e) => {
      const query = e.target.value;

      if (query.length < 2) {
        searchResultsContainer.style.display = 'none';
        searchResults.innerHTML = '';
        return;
      }

      try {
        const response = await fetch(`/api/search?q=${query}`);
        const results = await response.json();

        let html = '';
        if (results.length > 0) {
          html += '<ul class="divide-y divide-gray-200">';
          results.forEach(result => {
            html += `<li class="py-2"><a href="${result.url}" class="block hover:bg-gray-100 p-2 rounded-md">${result.label}</a></li>`;
          });
          html += '</ul>';
        } else {
          html = '<p class="p-4 text-gray-500">No results found.</p>';
        }
        searchResults.innerHTML = html;
        searchResultsContainer.style.display = 'block';
      } catch (error) {
        console.error('Error fetching search results:', error);
        searchResults.innerHTML = '<p class="p-4 text-red-500">Error loading results.</p>';
        searchResultsContainer.style.display = 'block';
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchResultsContainer.contains(e.target)) {
        searchResultsContainer.style.display = 'none';
      }
    });
  }
});
