window.onload = () => {
	setYearDataTables();
};

/* ---------------------------------------------------------------------------------------------- */
/*                             function to insert images of the table                             */
/* ---------------------------------------------------------------------------------------------- */

const genImage = (e) => {
	const id = e.getAttribute('id').split('-')[2];
	const date = document.getElementById(`gen-date-${id}`).innerText;

	const list = [];
	const table = document.getElementById(`table-${id}`);
	for (let i = 1; i < 7; i++) {
		const keys = [
			'room_no',
			'elec_reading',
			'elec_units',
			'elec_bill',
			'water_bill',
			'rent',
			'other',
			'total',
		];
		const tenant = {};
		keys.forEach((key) => {
			let elem = document.getElementsByClassName(`tdata-${i}-${id}-${key}`);
			tenant[key] = elem[0].innerText;
		});
		tenant['date'] = date;
		list.push(tenant);
	}
	const parent = table.parentNode;
	let imgBox = document.querySelector(`.tabel-${id}-img`);
	if (!imgBox) {
		parent.insertAdjacentHTML(
			'afterend',
			`<div class="tabel-${id}-img text-center mt-2 mb-4"><h5>Generating Images...</h5></div>`
		);
		imgBox = document.querySelector(`.tabel-${id}-img`);
	} else {
		imgBox.innerHTML = `<h5>Generating Images...</h5>`;
	}
	fetch('/imgservice', {
		// Adding method type
		method: 'POST',

		// Adding body or contents to send
		body: JSON.stringify({
			data: list,
		}),

		// Adding headers to the request
		headers: {
			'Content-type': 'application/json; charset=UTF-8',
		},
	}).then((resp) =>
		resp.json().then((links) => {
			const images = links.links.map(
				(link) =>
					`<img src="${link}" width="300px" class="shadow-sm rounded img-thumbnail">`
			);
			imgBox.innerHTML = images.join('');
		})
	);
};

const yearSelection = document.getElementById('year');

/* ---------------------------------------------------------------------------------------------- */
/*                                    to listen change in year                                    */
/* ---------------------------------------------------------------------------------------------- */

yearSelection.addEventListener('change', (e) => {
	setYearDataTables(e.target.value);
});

/* ---------------------------------------------------------------------------------------------- */
/*                                      To insert the tables                                      */
/* ---------------------------------------------------------------------------------------------- */

async function setYearDataTables(year) {
	const parent = document.querySelector('.tabel-container');
	parent.innerHTML = `<div class="d-flex flex-grow-1 align-items-start  justify-content-center">
							<div class="d-flex align-items-center justify-content-center flex-column">
								<div class="spinner-border text-light" style="width: 3rem; height: 3rem;transform-origin : center" role="status">
	  								<span class="sr-only">Loading...</span>
								</div>
								<h5 class="text-center text-secondary">Loading</h5>
							</div>	
  						</div>`;
	let url = '/yeardata';
	if (typeof year != 'undefined') url = `${url}?year=${year}`;
	let response = await fetch(url);
	response = await response.json();
	if (response.data) {
		parent.innerHTML = '';
		let { options, selection } = response;
		yearSelection.innerHTML = '';
		options.forEach((year) =>
			yearSelection.insertAdjacentHTML(
				'beforeend',
				`<option ${year == selection ? 'selected' : ''} >${year}</option>`
			)
		);
		response.data.forEach((monthData) => {
			let { id, date, month } = monthData;
			let rows = '';

			month.forEach((tenant) => {
				rows += `<tr>
							<th scope="row" class="tdata-${tenant.room_no}-${id}-room_no">${
					tenant.room_no
				}</th>
							<td class="tdata-${tenant.room_no}-${id}-elec_reading">${
					tenant.elec_reading
				}</td>
							<td class="tdata-${tenant.room_no}-${id}-elec_units">${tenant.elec_units}</td>
							<td class="tdata-${tenant.room_no}-${id}-elec_rate">${
					tenant.elec_bill / tenant.elec_units
				}</td>
							<td class="tdata-${tenant.room_no}-${id}-elec_bill">${tenant.elec_bill}</td>
							<td class="tdata-${tenant.room_no}-${id}-water_bill">${tenant.water_bill}</td>
							<td class="tdata-${tenant.room_no}-${id}-rent">${tenant.rent}</td>
							<td class="tdata-${tenant.room_no}-${id}-other">${tenant.other}</td>
							<td class="tdata-${tenant.room_no}-${id}-total">${tenant.total}</td>
			  			</tr>`;
			});

			let table = `<div class="table-responsive">
			<table class="table table-bordered" id="table-${id}">
				<thead class="thead-dark">
				  <tr>
					<th scope="col">Room No.</th>
					<th scope="col">Elec. Reading</th>
					<th scope="col">Elec. Unit</th>
					<th scope="col">Elec. Rate</th>
					<th scope="col">Elec. Bill</th>
					<th scope="col">Water Bill</th>
					<th scope="col">Rent</th>
					<th scope="col">Other</th>
					<th scope="col">Total</th>
				  </tr>
				</thead>
				<tbody>
					${rows}
				</tbody>
			  </table>
			  </div>`;

			let html = `
						<div class="mb-5">
						<div class="container-fluid d-flex my-2">
							<h4 class="mr-auto d-inline" id="gen-date-${id}">
								${date}
							</h4>
							<button class="btn btn-primary btn-sm ml-auto d-inline" id="gen-btn-${id}" onclick="genImage(this)">
								Generate Images
							</button>
						</div>
						<hr />
						${table}
						</div>`;

			parent.insertAdjacentHTML('beforeend', html);
		});
	} else {
		parent.insertAdjacentHTML('beforeend', `<h3>Failed to load data</h3>`);
	}
}
