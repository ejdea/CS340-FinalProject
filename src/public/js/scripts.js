/******************************************************************************
 * Author:     Edmund Dea
 * Student Id: 933280343
 * Date:       3/15/17
 * Class:      CS290
 * Title:      Week 9 - HW Assignment: Database and Interactions
 * Filename:   scripts.js
 ******************************************************************************/

/* Reference for Date Format: 
 * https://stackoverflow.com/questions/22061723/regex-date-validation-for-yyyy-mm-dd
 */
var isNumber = new RegExp("^-?[0-9]{1,}$");
var isDate =  new RegExp("^[0-9]{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$");

/* Reference: 
 * https://stackoverflow.com/questions/8624093/node-js-submit-form 
 */
$("#form1").submit(function(e) {
    e.preventDefault();

    var $this = $(this);
    var name = $("#form1 input[id='name']").val();
    var reps = $("#form1 input[id='reps']").val();
    var weight = $("#form1 input[id='weight']").val();
    var date = $("#form1 input[id='date']").val();
    var lbs = $("#form1 input[name='lbs']:checked").val();
    var ajaxData = {name : name, reps : reps, weight : weight, date : date, lbs : lbs};
    var postData = $this.serialize();

    if (document.getElementById("workout_table") == undefined) {
        postData += "&cmd=create";
    } else {
        postData += "&cmd=insert";
    }

    /*// Reset input form background colors
    $("#name").css({ "background-color": "#ACCEF7", "color": "#000" });
    $("#reps").css({ "background-color": "#ACCEF7", "color": "#000" });
    $("#weight").css({ "background-color": "#ACCEF7", "color": "#000" });
    $("#date").css({ "background-color": "#ACCEF7", "color": "#000" });
    $("#lbs").css({ "background-color": "#ACCEF7", "color": "#000" });*/

    // Validate input
    if (!isValidInput(name, reps, weight, date, lbs)) {
        return;
    }

    $.ajax({
        type: 'POST',
        url: $this.attr("action"),
        data: postData,
        success: function(data) {
            var obj = JSON.parse(data);
            ajaxData.id = obj.insertId;
            insertRow(ajaxData);
        },
        error: function(jqXHR, textStatus) { 
            alert("[AJAX Error] " + textStatus);
        },
        complete: function(jqXHR, textStatus) { 
            //console.log("[AJAX Complete] " + textStatus); 
        },
        datatype: 'json'
    });
});

function insertRow(data) {
    var table = document.getElementById("workout_table");

    if (table == undefined) {
        var main_div = document.getElementsByClassName("workout");

        if (main_div == undefined) {
            console.log("main_div undefined");
        } else {
            table = document.createElement("table");
            table.setAttribute("id", "workout_table");

            var tr_head = document.createElement("tr");

            var th1 = document.createElement("th");
            th1.textContent = "Name";
            tr_head.appendChild(th1);

            var th2 = document.createElement("th");
            th2.textContent = "Reps";
            tr_head.appendChild(th2);

            var th3 = document.createElement("th");
            th3.textContent = "Weight";
            tr_head.appendChild(th3);

            var th4 = document.createElement("th");
            th4.textContent = "Date";
            tr_head.appendChild(th4);

            var th5 = document.createElement("th");
            th5.textContent = "Lbs";
            tr_head.appendChild(th5);

            var th6 = document.createElement("th");
            th6.textContent = "Options";
            tr_head.appendChild(th6);

            table.appendChild(tr_head);
            main_div[0].appendChild(table);
        }
    }

    var tr = document.createElement("tr");

    var id = document.createElement("input");
    id.setAttribute("type", "hidden");
    id.setAttribute("value", data.id);
    tr.appendChild(id);

    for (var prop in data) {
        if (!(prop === "id")) {
            var td = document.createElement("td");

            var td_span = document.createElement("span");
            td_span.setAttribute("class", "show");
            td_span.setAttribute("id", 'workout1-' + prop + '-' + data.id);
            if (prop === "lbs") {
                td_span.innerHTML = (data[prop] === "1") ? "Lbs" : "Kg";
            } else {
                td_span.innerHTML = data[prop];
            }
            td.appendChild(td_span);

            var td_input = document.createElement("input");
            td_input.setAttribute("class", "hidden");
            td_input.setAttribute("id", 'workout2-' + prop + '-' + data.id);
            td_input.value = data[prop];
            td.appendChild(td_input);

            tr.appendChild(td);
        }
    }

    var td_buttons = document.createElement("td");
    td_buttons.classList.add("td_button");

    var editButton = document.createElement("button");
    editButton.setAttribute("type", "button");
    editButton.setAttribute("id", "edit-" + data.id);
    editButton.setAttribute("onclick", "editRow(this, " + data.id + ")");
    editButton.classList.add("td_button");
    editButton.textContent = "Edit";
    td_buttons.appendChild(editButton);

    var saveButton = document.createElement("button");
    saveButton.setAttribute("type", "button");
    saveButton.setAttribute("id", "save-" + data.id);
    saveButton.setAttribute("class", "hidden");
    saveButton.setAttribute("onclick", "saveRow(this, " + data.id + ")");
    saveButton.classList.add("td_button");
    saveButton.textContent = "Save Changes";
    td_buttons.appendChild(saveButton);

    var deleteButton = document.createElement("button");
    deleteButton.setAttribute("type", "button");
    deleteButton.setAttribute("id", "delete-" + data.id);
    deleteButton.setAttribute("onclick", "deleteRow(this, " + data.id + ")");
    deleteButton.classList.add("td_button");
    deleteButton.textContent = "Delete";
    td_buttons.appendChild(deleteButton);

    tr.appendChild(td_buttons);

    table.appendChild(tr);
}

function editRow(btn, id) {
    $('#workout1-name-' + id).removeClass("show").addClass("hidden");
    $('#workout2-name-' + id).removeClass("hidden").addClass("show");
    $('#workout1-reps-' + id).removeClass("show").addClass("hidden");
    $('#workout2-reps-' + id).removeClass("hidden").addClass("show");
    $('#workout1-weight-' + id).removeClass("show").addClass("hidden");
    $('#workout2-weight-' + id).removeClass("hidden").addClass("show");
    $('#workout1-date-' + id).removeClass("show").addClass("hidden");
    $('#workout2-date-' + id).removeClass("hidden").addClass("show");
    $('#workout1-lbs-' + id).removeClass("show").addClass("hidden");
    $('#workout2-lbs-' + id).removeClass("hidden").addClass("show");
    $('#edit-' + id).removeClass("show").addClass("hidden");
    $('#save-' + id).removeClass("hidden").addClass("show");
}

function isValidInput(name, reps, weight, date, lbs) {
    if (!name || name.length === 0) {
        //$("#name").css({ "background-color": "red", "color": "#fff" });
        alert("Error: Name is invalid.");
        return false;
    }
    if (lbs === undefined) {
        //$("#lbs").css({ "background-color": "red", "color": "#fff" });
        alert("Error: Lbs or Kilos must be selected.");
        return false;
    }
    else if (lbs != 1 && lbs != 0) {
        alert("Error: Invalid weight unit (lbs=1, kg=0).");
        return false;
    }
    if (!reps || reps.length === 0 || !isNumber.test(reps)) {
        //$("#reps").css({ "background-color": "red", "color": "#fff" });
        alert("Error: Reps is invalid.");
        return false;
    }
    if (!weight || weight.length === 0 || !isNumber.test(weight)) {
        //$("#weight").css({ "background-color": "red", "color": "#fff" });
        alert("Error: Weight is invalid.");
        return false;
    }
    if (!date || date.date === 0 || !isDate.test(date)) {
        //$("#date").css({ "background-color": "red", "color": "#fff" });
        alert("Error: Date is invalid.");
        return false;
    }

    return true;
}

function saveRow(btn, id) {
    var row = btn.parentNode;
    var span_name = document.getElementById('workout1-name-' + id);
    var span_reps = document.getElementById('workout1-reps-' + id);
    var span_weight = document.getElementById('workout1-weight-' + id);
    var span_date = document.getElementById('workout1-date-' + id);
    var span_lbs = document.getElementById('workout1-lbs-' + id);

    var new_name = document.getElementById('workout2-name-' + id).value;
    var new_reps = document.getElementById('workout2-reps-' + id).value;
    var new_weight = document.getElementById('workout2-weight-' + id).value;
    var new_date = document.getElementById('workout2-date-' + id).value;
    var new_lbs = document.getElementById('workout2-lbs-' + id).value;

    // Validate input
    if (!isValidInput(new_name, new_reps, new_weight, new_date, new_lbs)) {
        return;
    }

    var postdata = { cmd : "edit",
                     id : id,
                     name : new_name,
                     reps : new_reps,
                     weight : new_weight,
                     date : new_date,
                     lbs : new_lbs
                   };
    var $this = $(this);

    $.ajax({
        type: 'POST',
        url: $this.closest("button").attr("action"),
        data: postdata,
        success: function(data) {
            span_name.innerText = new_name;
            span_reps.innerText = new_reps;
            span_weight.innerText = new_weight;
            span_date.innerText = new_date;
            if (new_lbs == 1) {
                span_lbs.innerText = "Lbs";
            } else if (new_lbs == 0) {
                span_lbs.innerText = "Kg";
            }

            $('#workout2-name-' + id).removeClass("show").addClass("hidden");
            $('#workout1-name-' + id).removeClass("hidden").addClass("show");
            $('#workout2-reps-' + id).removeClass("show").addClass("hidden");
            $('#workout1-reps-' + id).removeClass("hidden").addClass("show");
            $('#workout2-weight-' + id).removeClass("show").addClass("hidden");
            $('#workout1-weight-' + id).removeClass("hidden").addClass("show");
            $('#workout2-date-' + id).removeClass("show").addClass("hidden");
            $('#workout1-date-' + id).removeClass("hidden").addClass("show");
            $('#workout2-lbs-' + id).removeClass("show").addClass("hidden");
            $('#workout1-lbs-' + id).removeClass("hidden").addClass("show");
        },
        error: function(jqXHR, textStatus) { 
            alert("[AJAX Error] " + textStatus);
        },
        complete: function(jqXHR, textStatus) {
            $('#edit-' + id).removeClass("hidden").addClass("show");
            $('#save-' + id).removeClass("show").addClass("hidden");
        },
        datatype: 'json'
    });
}

function deleteRow(btn, id) {
    var row = btn.parentNode.parentNode;
    var data = {cmd : "delete", id : id};
    var $this = $(this);

    $.ajax({
        type: 'POST',
        url: $this.closest("button").attr("action"),
        data: data,
        success: function(data) {
            row.parentNode.removeChild(row);
        },
        error: function(jqXHR, textStatus) { 
            alert("[AJAX Error] " + textStatus);
        },
        complete: function(jqXHR, textStatus) { 
            //console.log("[AJAX Complete] " + textStatus); 
        },
        datatype: 'json'
    });
}
