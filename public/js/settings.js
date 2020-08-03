
$(document).ready(function(){ 
	$("#settingTabs li:eq(0) a").tab('show');
});


let form = document.getElementById('default-values');
let state = {
	lastErrors: [],
};

/* ---------------------------------------------------------------------------------------------- */
/*                                      Form submission logic                                     */
/* ---------------------------------------------------------------------------------------------- */

form.addEventListener('submit', function (e) {
    e.preventDefault();
    let change_btn = document.getElementById('change-values-btn')
    change_btn.setAttribute("disabled","")
    change_btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    <span>Updating...</span>`
	let defaultValues = new FormData(this);
	let payload = {};
	for (var pair of defaultValues.entries()) {
		payload[pair[0]] = pair[1];
	}
	state.lastErrors.forEach((input) => input.classList.toggle('is-invalid'));
    state.lastErrors = [];
    let status = document.getElementById('change_val_status')
    if(status) status.remove()
	fetch('/settings/defaultvalues', {
		// Adding method type
		method: 'POST',

		// Adding body or contents to send
		body: JSON.stringify({
			data: payload,
		}),

		// Adding headers to the request
		headers: {
			'Content-type': 'application/json; charset=UTF-8',
		},
	})
		.then((response) => response.json())
		.then((res) => {
			if (res.error)
				res.error.forEach((err) => {
					let input = document.getElementById(err[0]);
					state.lastErrors.push(input);
					let input_error = document.getElementById(err[0] + '-status');
					input.classList.toggle('is-invalid');
					input_error.innerText = err[1];
				});
			if (res.values) {
				res.values.forEach((value) =>
					document.getElementById(value[0]).setAttribute('value', value[1])
				);
				form.insertAdjacentHTML(
					'beforebegin',
					`<div class="alert alert-dismissible alert-success" id="change_val_status">
        <button type="button" class="close" data-dismiss="alert">&times;</button>
        <strong>Values updated Successfully!</strong>
    </div>`
				);
            }
            change_btn.removeAttribute("disabled")
            change_btn.innerHTML = `Update`
		})
		.catch((err) =>
			form.insertAdjacentHTML(
				'beforebegin',
				`<div class="alert alert-dismissible alert-danger" id="change_val_status">
    <button type="button" class="close" data-dismiss="alert">&times;</button>
    <strong>${err.message}</strong>
</div>`
			)
		);
});
