document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('live-search');
    const searchResults = document.getElementById('search-results');

    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value;

            if (query.length < 2) {
                searchResults.innerHTML = '';
                return;
            }

            try {
                const response = await fetch(`/api/police/search?q=${query}`);
                const results = await response.json();

                let html = '<ul>';
                if (results.length > 0) {
                    results.forEach(result => {
                        html += `<li><a href="/${result.type.toLowerCase()}s/${result.id}">${result.name} - <span class="context">${result.context}</span></a></li>`;
                    });
                } else {
                    html += '<li>No results found</li>';
                }
                html += '</ul>';
                html += '<a href="/police/search" class="advanced-search-link">Advanced Search</a>';

                searchResults.innerHTML = html;
            } catch (error) {
                console.error('Error fetching search results:', error);
                searchResults.innerHTML = '<li>Error loading results</li>';
            }
        });
    }
});
