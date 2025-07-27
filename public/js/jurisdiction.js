document.addEventListener('DOMContentLoaded', () => {
    const regionsList = document.getElementById('regions-list');
    const districtsList = document.getElementById('districts-list');
    const citiesList = document.getElementById('cities-list');
    const policeStationsList = document.getElementById('police-stations-list');
    const courtsList = document.getElementById('courts-list');

    const addRegionButton = document.getElementById('add-region-button');
    const addDistrictButton = document.getElementById('add-district-button');
    const addCityButton = document.getElementById('add-city-button');
    const addFacilityButton = document.getElementById('add-facility-button');

    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalForm = document.getElementById('modal-form');
    const editIdInput = document.getElementById('edit-id');
    const parentIdInput = document.getElementById('parent-id');
    const nameInput = document.getElementById('name');
    const closeButton = document.querySelector('.close-button');

    let selectedRegionId = null;
    let selectedDistrictId = null;
    let selectedCityId = null;
    let currentEntityType = '';

    function openModal(entityType, parentId = null, editId = null, currentName = '') {
        currentEntityType = entityType;
        modal.style.display = 'block';
        modalTitle.textContent = editId ? `Edit ${entityType}` : `Add ${entityType}`;
        editIdInput.value = editId;
        parentIdInput.value = parentId;
        nameInput.value = currentName;
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    closeButton.onclick = closeModal;
    window.onclick = (event) => {
        if (event.target == modal) {
            closeModal();
        }
    };

    addRegionButton.addEventListener('click', () => openModal('Region'));
    addDistrictButton.addEventListener('click', () => openModal('District', selectedRegionId));
    addCityButton.addEventListener('click', () => openModal('City', selectedDistrictId));
    addFacilityButton.addEventListener('click', () => openModal('Facility', selectedCityId));

    modalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = nameInput.value;
        const editId = editIdInput.value;
        const parentId = parentIdInput.value;
        let url = '/api/jurisdiction/';
        let method = 'POST';

        switch (currentEntityType) {
            case 'Region':
                url += 'regions';
                break;
            case 'District':
                url += `regions/${parentId}/districts`;
                break;
            case 'City':
                url += `districts/${parentId}/cities`;
                break;
            case 'Facility':
                // This needs to be handled differently as there are two types of facilities
                break;
        }

        if (editId) {
            url += `/${editId}`;
            method = 'PUT';
        }

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });

        closeModal();
        fetchAndDisplayRegions();
        if (selectedRegionId) fetchAndDisplayDistricts(selectedRegionId);
        if (selectedDistrictId) fetchAndDisplayCities(selectedDistrictId);
        if (selectedCityId) fetchAndDisplayFacilities(selectedCityId);
    });

    async function fetchAndDisplayRegions() {
        const response = await fetch('/api/jurisdiction/regions');
        const regions = await response.json();
        regionsList.innerHTML = '';
        regions.forEach(region => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${region.name}</span><div class="actions"><button class="edit-region" data-id="${region.id}" data-name="${region.name}">E</button><button class="delete-region" data-id="${region.id}">D</button></div>`;
            li.dataset.id = region.id;
            li.querySelector('.edit-region').addEventListener('click', (e) => {
                e.stopPropagation();
                openModal('Region', null, region.id, region.name);
            });
            li.querySelector('.delete-region').addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('Are you sure?')) {
                    await fetch(`/api/jurisdiction/regions/${region.id}`, { method: 'DELETE' });
                    fetchAndDisplayRegions();
                }
            });
            li.addEventListener('click', () => {
                selectedRegionId = region.id;
                fetchAndDisplayDistricts(region.id);
                document.querySelectorAll('#regions-list li').forEach(item => item.classList.remove('active'));
                li.classList.add('active');
                addDistrictButton.disabled = false;
                addCityButton.disabled = true;
                addFacilityButton.disabled = true;
                districtsList.innerHTML = '';
                citiesList.innerHTML = '';
                policeStationsList.innerHTML = '';
                courtsList.innerHTML = '';
            });
            regionsList.appendChild(li);
        });
    }

    async function fetchAndDisplayDistricts(regionId) {
        const response = await fetch(`/api/jurisdiction/regions/${regionId}/districts`);
        const districts = await response.json();
        districtsList.innerHTML = '';
        if (districts.length === 0) {
            districtsList.innerHTML = '<li>No districts in this region.</li>';
        } else {
            districts.forEach(district => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${district.name}</span><div class="actions"><button class="edit-district" data-id="${district.id}" data-name="${district.name}">E</button><button class="delete-district" data-id="${district.id}">D</button></div>`;
                li.dataset.id = district.id;
                li.querySelector('.edit-district').addEventListener('click', (e) => {
                    e.stopPropagation();
                    openModal('District', regionId, district.id, district.name);
                });
                li.querySelector('.delete-district').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure?')) {
                        await fetch(`/api/jurisdiction/districts/${district.id}`, { method: 'DELETE' });
                        fetchAndDisplayDistricts(regionId);
                    }
                });
                li.addEventListener('click', () => {
                    selectedDistrictId = district.id;
                    fetchAndDisplayCities(district.id);
                    document.querySelectorAll('#districts-list li').forEach(item => item.classList.remove('active'));
                    li.classList.add('active');
                    addCityButton.disabled = false;
                    addFacilityButton.disabled = true;
                    citiesList.innerHTML = '';
                    policeStationsList.innerHTML = '';
                    courtsList.innerHTML = '';
                });
                districtsList.appendChild(li);
            });
        }
    }

    async function fetchAndDisplayCities(districtId) {
        const response = await fetch(`/api/jurisdiction/districts/${districtId}/cities`);
        const cities = await response.json();
        citiesList.innerHTML = '';
        if (cities.length === 0) {
            citiesList.innerHTML = '<li>No cities in this district.</li>';
        } else {
            cities.forEach(city => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${city.name}</span><div class="actions"><button class="edit-city" data-id="${city.id}" data-name="${city.name}">E</button><button class="delete-city" data-id="${city.id}">D</button></div>`;
                li.dataset.id = city.id;
                li.querySelector('.edit-city').addEventListener('click', (e) => {
                    e.stopPropagation();
                    openModal('City', districtId, city.id, city.name);
                });
                li.querySelector('.delete-city').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure?')) {
                        await fetch(`/api/jurisdiction/cities/${city.id}`, { method: 'DELETE' });
                        fetchAndDisplayCities(districtId);
                    }
                });
                li.addEventListener('click', () => {
                    selectedCityId = city.id;
                    fetchAndDisplayFacilities(city.id);
                    document.querySelectorAll('#cities-list li').forEach(item => item.classList.remove('active'));
                    li.classList.add('active');
                    addFacilityButton.disabled = false;
                    policeStationsList.innerHTML = '';
                    courtsList.innerHTML = '';
                });
                citiesList.appendChild(li);
            });
        }
    }

    async function fetchAndDisplayFacilities(cityId) {
        const policeStationsResponse = await fetch(`/api/jurisdiction/cities/${cityId}/police-stations`);
        const policeStations = await policeStationsResponse.json();
        policeStationsList.innerHTML = '';
        if (policeStations.length === 0) {
            policeStationsList.innerHTML = '<li>No police stations in this city.</li>';
        } else {
            policeStations.forEach(station => {
                const li = document.createElement('li');
                li.textContent = station.name;
                policeStationsList.appendChild(li);
            });
        }

        const courtsResponse = await fetch(`/api/jurisdiction/cities/${cityId}/courts`);
        const courts = await courtsResponse.json();
        courtsList.innerHTML = '';
        if (courts.length === 0) {
            courtsList.innerHTML = '<li>No courts in this city.</li>';
        } else {
            courts.forEach(court => {
                const li = document.createElement('li');
                li.textContent = court.name;
                courtsList.appendChild(li);
            });
        }
    }

    fetchAndDisplayRegions();
});
