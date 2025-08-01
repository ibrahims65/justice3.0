document.addEventListener('DOMContentLoaded', function () {
    function openSlideOver(mod) {
      const so = document.getElementById('slideOver');
      so.__x.$data.module = mod;
      so.__x.$data.open = true;

      fetch(`/police/cases/${CASE_ID}/${mod}`)
        .then(res => res.json())
        .then(data => {
          const listHtml = renderList(mod, data);
          const formHtml = renderForm(mod);
          document.getElementById('moduleContent').innerHTML = listHtml + formHtml;
        });
    }

    function closeSlideOver() {
      document.getElementById('slideOver').__x.$data.open = false;
    }

    function renderList(mod, data) {
      let itemsHtml = '<p>No items yet.</p>';
      if (data && data.length > 0) {
        itemsHtml = '<ul>' + data.map(item => `<li>${getListItem(mod, item)}</li>`).join('') + '</ul>';
      }
      return `<h2>${window.labels[mod]}</h2>${itemsHtml}`;
    }

    function getListItem(mod, item) {
      switch (mod) {
        case 'evidence':
          return `${item.evidenceType}: ${item.description}`;
        case 'investigations':
          return `${item.investigatorName}: ${item.details}`;
        case 'victims':
          return `${item.name} — ${item.statement || 'No statement'}`;
        case 'witnesses':
          return `${item.name} — ${item.statement || 'No statement'}`;
        case 'hearings':
          return `${new Date(item.hearingDate).toLocaleString()} — ${item.verdict || 'No verdict'}`;
        case 'warrants':
          return `${item.status}: ${item.details}`;
        default:
          return JSON.stringify(item);
      }
    }

    function renderForm(mod) {
      const formContent = getFormFields(mod);
      return `
        <hr class="my-4">
        <h3>Add New ${window.labels[mod]}</h3>
        <form action="/police/cases/${CASE_ID}/${mod}" method="POST">
          ${formContent}
          <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded mt-2">Add</button>
        </form>
      `;
    }

    function getFormFields(mod) {
      switch (mod) {
        case 'evidence':
          return `
            <input type="text" name="evidenceType" placeholder="Evidence Type" class="border p-1 w-full">
            <textarea name="description" placeholder="Description" class="border p-1 w-full mt-2"></textarea>
          `;
        case 'investigations':
          return `
            <input type="text" name="investigatorName" placeholder="Investigator Name" class="border p-1 w-full">
            <input type="text" name="investigatorBadgeNumber" placeholder="Badge Number" class="border p-1 w-full mt-2">
            <input type="text" name="investigatorRank" placeholder="Rank" class="border p-1 w-full mt-2">
            <textarea name="details" placeholder="Details" class="border p-1 w-full mt-2"></textarea>
          `;
        case 'victims':
          return `
            <input type="text" name="name" placeholder="Victim Name" class="border p-1 w-full">
            <textarea name="statement" placeholder="Statement" class="border p-1 w-full mt-2"></textarea>
          `;
        case 'witnesses':
          return `
            <input type="text" name="name" placeholder="Witness Name" class="border p-1 w-full">
            <textarea name="statement" placeholder="Statement" class="border p-1 w-full mt-2"></textarea>
          `;
        case 'hearings':
          return `
            <input type="datetime-local" name="hearingDate" class="border p-1 w-full">
            <input type="text" name="verdict" placeholder="Verdict" class="border p-1 w-full mt-2">
            <input type="text" name="courtId" placeholder="Court ID" class="border p-1 w-full mt-2">
          `;
        case 'warrants':
          return `
            <input type="text" name="status" placeholder="Status" class="border p-1 w-full">
            <textarea name="details" placeholder="Details" class="border p-1 w-full mt-2"></textarea>
            <input type="datetime-local" name="expiresAt" class="border p-1 w-full mt-2">
          `;
        default:
          return '';
      }
    }

    // Make functions available globally
    window.openSlideOver = openSlideOver;
    window.closeSlideOver = closeSlideOver;
});
