    //How to start the plugin

    /*
    Add the html template
    data-list-name -> attribute with listName
    <div data-list-name="Products" id="form1"></div>
    */

    //Set custom options if needed
    //var options = { columns: [{ internalName: "Title", removeFromForm: true }] }

    //Initialize the plugin
    //var spForm = SpForms('#form1', options);

    //Run the plugin
    //spForm.buildForm().run();

var SpForms = function (formId, customOptions) {

    var column = {
        container: "",
        internalName: "",
        displayName: "",
        showLabel: true,
        readOnly: false,
        removeFromForm: true,
        pluginCallback: null
    };

    var options = {
        allFieldsString: '[data-list-field="true"]',
        columns: [],
        inputContainer: { //html container for inputs
            element: "<div />",
            class: "form-group"
        },
        label: {
            class: "",
            showRequired: true
        },
        input: {
            class: "form-control", //class for inputs
            initDatePlugin: null //pluginCallback
        },
        boolean: {
            container: "",
            class: "",
        },
        lookUp: {
            defaultValue: "", //default value for selects
            defaultText: "Seleccione", //default text for selects
            disabled: true //disabled for default value
        },
        buttons: {
            container: $("<div />", { class: "form-group text-right" }), //html Container for buttons
            cancelBtn: {
                class: "btn btn-secondary mr-2", //class for cancelbutton
                url: null, //url for redirect
                text: "Cancelar", //text for button
                action: null //custom callback on click
            },
            submitBtn: {
                class: "btn btn-primary", //class for submitbutton
                url: null, //url for redirect
                text: "Guardar", //text for button
                action: null //custom callback on click
            }
        },
        events: { //custom callbacks
            onBuildStart: null,
            onBuildFinish: null,
            onRunStart: null,
            onRunFinish: null,
            onPreparaDataStart: null,
            onPrepareDataFinish: null,
            onSaveStart: null,
            onSaveFinish: null
        }
    };

    if (customOptions) {
        $.extend( options, customOptions );
    }

    /************PRIVATE***************/
    var $form = $(formId);
    var formIdNoHash = formId.replace("#", "");
    var listName = $form.attr('data-list-name');
    var selectorString = '[data-list-name="' + listName + '"]';
    var allFieldsString = options.allFieldsString;
    var inputContainer = $(options.inputContainer.element, { class: options.inputContainer.class });
    var onBuildComplete = false;
    var onLookupFillComplete = false;
    var oldItem = null;

    function showError(str){
        var $divError = $("<div />", { class: "error-msg alert alert-danger", role: "alert", text: str });
        $('.error-msg').remove();
        $form.prepend($divError);
    }
      
    function parseAjaxError(data){    
        if(typeof data !== 'undefined'){
            var obj = $.parseJSON(data.responseText);
            return obj.error.message.value;
        }else{
            return 'an unknown error occurred';
        }           
    }

    /************BUILD FORM************/
    function buildForm() {
        
        getListFields().done(function(item) {
            if (item.d.results.length > 0){
                addFields(item.d.results);

                setTimeout(function() {
                    fillLookupFields();
                    onBuildComplete = true;
                }, 200);
                
            } 
        }).fail(function(err) {          
            showError(parseAjaxError(err));
        });

        return {
            run: run
        };
    }

    function addFields(fields) {
        var $htmlCollection = [];

        $.each(fields, function () {
            var field = this;

            if (removeItFromForm(field) || existInForm(field)) {
                return true;
            }

            var $container = inputContainer.clone();
            
            var $label = buildLabel(field);
            $container.append($label);

            switch (field.TypeAsString) {
                case "Text":
                    $container.append(buildInput(field));
                    break;
                case "Number":
                    $container.append(buildInput(field));
                    break;
                case "DateTime":
                    $container.append(buildInputDateTime(field));
                    break;
                case "Boolean":
                    $container.append(buildInputBoolean(field));
                    break;
                case "Note":
                    $container.append(buildTextArea(field));
                    break;
                case "Lookup":
                    $container.append(buildSelect(field));
                    break;
                case "Choice":
                    $container.append(buildSelect(field));
                    break;
                default:
                    return true;
            }
            
            $htmlCollection.push($container);
        });

        if ($htmlCollection.length > 0) {
            $htmlCollection = buildButtons($htmlCollection);
        }

        $form.append($htmlCollection);
        console.log(fields);
    }

    function removeItFromForm(field) {
        var removeIt = false;

        if (options.columns.length > 0) {
            $.each(options.columns, function () {
                if (this.internalName != undefined) {
                    if (field.InternalName == this.internalName) {
                        
                        if (this.removeFromForm) {
                            removeIt = true;
                        }

                        return false;
                    }
                }
            });
        }

        return removeIt;
    }

    function existInForm(field) {
        var exist = false;
        var $field = $("#" + field.InternalName);

        if ($field.length > 0) {
            exist = true;
        }
            
        return exist;
    }

    function buildInput(field) {
        var $input = $("<input>");
        var inputType = "text";
        var inputClass = options.input.class;
        
        if (field.TypeAsString == "Number") {
            inputType = "number";
        } else if (field.TypeAsString == "DateTime") {
            inputType = !options.input.initDatePlugin ? "date" : "text";
        }

        $input.attr({
            type: inputType,
            id: field.InternalName,
            name: field.InternalName,
            class: inputClass,
            "data-type": field.TypeAsString,
            "data-list-field": true
        });

        if (field.Required) {
            $input.attr("data-rules", "required");
        }

        return $input;
    }

    function buildInputDateTime(field) {
        var $input = $("<input>");
        var inputType = !options.input.initDatePlugin ? "date" : "text";

        $input.attr({
            type: inputType,
            id: field.InternalName,
            name: field.InternalName,
            class: options.input.class,
            "data-type": field.TypeAsString,
            "data-list-field": true
        });

        if (field.Required) {
            $input.attr("data-rules", "required");
        }

        if (field.DefaultValue == "[today]") {
            $input.val(formatDate(new Date()));
        }

        return $input;
    }

    function buildInputBoolean(field) {
        var $input = $("<input>");
        
        $input.attr({
            type: "checkbox",
            id: field.InternalName,
            name: field.InternalName,
            class: options.boolean.class,
            "data-type": field.TypeAsString,
            "data-list-field": true
        });

        return $input;
    }

    function buildTextArea(field) {
        var $input = $("<textarea>");
        $input.attr({
            id: field.InternalName,
            name: field.InternalName,
            class: options.input.class,
            "data-type": field.TypeAsString,
            "data-list-field": true
        });

        if (field.Required) {
            $input.attr("data-rules", "required");
        }

        return $input;
    }

    function buildSelect(field) {
        var $input = $("<select>");
        $input.attr({
            id: field.InternalName,
            name: field.InternalName,
            class: options.input.class,
            "data-type": field.TypeAsString,
            "data-lookup-list": field.LookupList,
            "data-lookup-field": field.LookupField,
            "data-list-field": true
        });

        if (field.Required) {
            $input.attr("data-rules", "required");
        }

        if (field.TypeAsString == "Choice") {
            var $optionsCollection = [];
            $.each(field.Choices.results, function () {
                var $option = $("<option />", { value: this, text: this });

                if (field.DefaultValue == this) {
                    $option.attr("selected", true);
                }

                $optionsCollection.push($option);
            })

            $input.append($optionsCollection);
        }

        return $input;
    }

    function buildLabel(field) {
        var $label = $("<label>", { text: field.Title, class: options.label.class });

        if (field.TypeAsString == "Boolean") {
            $label.append("&ensp;")
        } else if (field.Required && options.label.showRequired)  {
            $label.append(" *"); 
        }

        return $label;
    }

    function buildButtons($htmlCollection) {
        
        var $container = options.buttons.container.clone();
        var $button = $("<button />", { type: "button" });
        
        if (options.buttons.cancelBtn) {
            var $cancelBtn = $button.clone();
            $cancelBtn.attr({
                class: options.buttons.cancelBtn.class,
                "data-type": "Cancel"
            }).text(options.buttons.cancelBtn.text);
            $container.append($cancelBtn);
        }

        $button.attr({
            class: options.buttons.submitBtn.class,
            "data-type": "Submit"
        }).text(options.buttons.submitBtn.text);
        $container.append($button);

        $htmlCollection.push($container);

        return $htmlCollection;
    }

    function formatDate(date) {
        var date = new Date(date);
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var monthStr = month.toString().length == 1 ? ("0" + month) : month.toString();
        var day = date.getDate();
        var dayStr = day.toString().length == 1 ? ("0" + day) : day.toString();
        var stringDate = year + "-" + monthStr + "-" + dayStr;

        return stringDate;
    }

    function getListFields() {

        var endpoint = "/_api/web/lists/getbytitle('" + listName + "')/fields";
		endpoint = _spPageContextInfo.webAbsoluteUrl + endpoint;     
		endpoint += "?$filter=Hidden eq false and ReadOnlyField eq false";
		var ajax = $.ajax({
			url: endpoint,
			method: "GET",
			headers: { "Accept": "application/json; odata=verbose" }
        });
        
		return ajax;
    }

    
    /************END BUILD FORM************/

    /************FILL LOOKUP FIELDS************/
    function fillLookupFields() {
        $form.find('[data-type="Lookup"]').each(function () {
            var elm = this;
            var list = $(elm).data("lookup-list");
            var field = $(elm).data("lookup-field");
            getLookUpValues(list).done(function (data) {
                var $optionsCollection = [];
                $.each(data.d.results, function () {
                    var $option = $("<option />", { value: this.ID, text: this[field] });
                    $optionsCollection.push($option);
                });
                
                if (options.lookUp != null) {
                    var $option = $("<option />", { 
                        value: options.lookUp.defaultValue, 
                        text: options.lookUp.defaultText,
                    });

                    if (options.lookUp.disabled) {
                        $option.attr({ disabled: true, selected: true });
                    }

                    $optionsCollection.splice(0,0,$option);
                }

                $(elm).append($optionsCollection);
            });
        });
    }

    function getLookUpValues(list) {

        var endpoint = "/_api/web/lists('" + list + "')/items";
		endpoint = _spPageContextInfo.webAbsoluteUrl + endpoint;     
		//endpoint += "?$filter=Hidden eq false and ReadOnlyField eq false";
		var ajax = $.ajax({
			url: endpoint,
			method: "GET",
			headers: { "Accept": "application/json; odata=verbose" }
        });
        
		return ajax;

    }
    /************END FILL LOOKUP FIELDS************/


    /************VALIDATE & SUBMIT FIELDS************/
    
    function run() {

        var spFormsrunInterval = setInterval(function () {
            if (onBuildComplete) {
                clearInterval(spFormsrunInterval);

                if(urlParam(formIdNoHash)){
                    var recordId = urlParam(formIdNoHash);
                    getItemById(recordId).done(function(item){
                        if (item.d.results.length > 0){
                            oldItem = item.d.results[0];
                            showFieldValues(item.d.results);
                        } else {
                            showError("No record has been found");
                        }
                    }).fail(function(err){          
                        showError(parseAjaxError(err));
                    });
                    
                    //return false;        //exit out if record is found 
                }

                var btn = $form.find('[data-type="Submit"]');
                btn.on('click', function () {
                    if (validateFields()) {
                        //showLoading();
                        getListType(listName).done(function (data1) {
                            var listType = data1.d.ListItemEntityTypeFullName;
                            var ajax = saveData(oldItem, listType, listName);
                            ajax.done(function (success) {
                                /*if($(selectorString + ' [name="attachment"]').length > 0){
                                    if($(selectorString + ' [name="attachment"]')[0].files[0] 
                                        && success.d.ID){ //IF THERE IS A FILE && HAS ID
                                        var file =  $(selectorString + ' [name="attachment"]')[0].files[0];
                                        var ajaxFromFileUPload = uploadFile(file,listName,success.d.ID)                        
                                        ajaxFromFileUPload.done(function(){     
                                            updateUrl(success.d.ID);                      
                                            showSuccess();
                                        })
                                        ajaxFromFileUPload.fail(function(err){
                                            showError(parseAjaxError(err));
                                        })
                                        return;
                                    }
                                } */
                                setTimeout(function () {
                                    var ID = oldItem ? oldItem.ID : success.d.ID;
                                    redirect(ID);
                                    //showSuccess();
                                }, 1000);
                            });
                            ajax.fail(function (err) {
                                showError(parseAjaxError(err));
                            });
                        }); //end getListType();
                    }
                    return false;
                }); //end submit form
            }
        }, 200)

    }

    function redirect(id){
        var url = window.location.href + "?" + formIdNoHash + "=" + id;
        
        if (oldItem) {
            location.reload()
        } else {
            location.href = url;
        }
        //history.pushState({}, "Page", url);
    }

    function validateFields() {
        resetErrors(); 
        var valid = false;
        var errors = {};

        $(allFieldsString).each(function(index) {
            var item = $(this);
            var rules = item.data('rules');
            if (typeof rules !== 'undefined') {
                var rulesArr = rules.split('|');
                errors[item.attr("name")] = [];
                $.each(rulesArr, function(x, xitem) {
                    switch (xitem) {
                        case 'required':  
                            if (item.data("type") == "Text") {
                                if (item.val().trim().length == 0) {
                                    errors[item.attr("name")].push("Este campo es obligatorio");
                                }
                            } else if (item.data("type") == "Note") {
                                if (item.val().trim().length == 0) {
                                    errors[item.attr("name")].push("Este campo es obligatorio");
                                }
                            } else if (item.data("type") == "Number") {
                                if (item.val().trim().length == 0 || isNaN(item.val()) == true) {
                                    errors[item.attr("name")].push("No es un número valido");
                                }
                            } else if (item.data("type") == "Lookup") {
                                if (item.val() == null || item.val().toString().trim().length == 0) {
                                    errors[item.attr("name")].push("Este campo debe tener una selección");
                                }
                            } else if (item.data("type") == "Choice") {
                                if (item.val() == null || item.val().toString().trim().length == 0) {
                                    errors[item.attr("name")].push("Este campo debe tener una selección");
                                }
                            } else if (item.data("type") == "DateTime") {
                                if (item.val() !== '') {                                    
                                    var timestamp = Date.parse(item.val());
                                    if(isNaN(timestamp) == true){
                                      errors[item.attr("name")].push("No es una fecha valida");
                                    }
                                }
                            }
                            break;
                    }

                }); //end each rules
                if (errors[item.attr("name")].length === 0) {
                    delete errors[item.attr("name")];
                }
            }
        });

        

        if (Object.keys(errors).length > 0) {
            $.each(errors, function(key, value) {
                var msg = errors[key].toString();
                $(selectorString + ' [name="' + key + '"]')
                    .addClass('hasError')
                    .after('<small class="form-text text-danger error">' + msg.replace(',', ', ') + '</small>');
            });

            $('.hasError:first').focus();
        } else {
            valid = true;
        }
        return valid;
    }

    function saveData(oldItem, listType, listName){        
        
        var data = {
            "__metadata": { "type": listType }      
        };

        $.extend(data, prepareData());

        console.log(data);

        var endpoint = "/_api/web/lists/getbytitle('" + listName + "')/items";
        var type = "POST";
        var headers = {
            "Accept": "application/json;odata=verbose",
            "X-RequestDigest": $("#__REQUESTDIGEST").val()
        };

        if (oldItem) {
            endpoint += "(" + oldItem.ID + ")";
            type = "PATCH";
            headers = {
                "accept": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "content-Type": "application/json;odata=verbose",
                "X-Http-Method": "PATCH",
                "If-Match": oldItem.__metadata.etag
            }
        }

        var ajax = $.ajax({
            url: _spPageContextInfo.webAbsoluteUrl + endpoint,
            type: type,
            contentType: "application/json;odata=verbose",
            data: JSON.stringify(data),
            headers: headers,
            error: function (data) {          
                showError(parseAjaxError(data));
            }
        });
    
        return ajax;
    }

    function prepareData() {
        var data = {};
        $(allFieldsString).each(function(i,item) {
            var field = $(this);
            var name = field.attr('name');

            switch (field.data('type')) {
                case 'DateTime':
                    var dateValue = new Date(field.val());
                    data[name] = dateValue.toString() != "Invalid Date" ? dateValue.toISOString() : null;
                    break;
                case 'Lookup':
                    data[name + "Id"] = field.val();
                    break;
                case 'Boolean':
                    data[name] = field.is(":checked");
                    break;
                default:
                    data[name] = field.val();
                    break;
            }
            
        });

        return data;
    }

    function showFieldValues(itemFound){        
        $(allFieldsString).each(function(i,item){ 
            var field = $(this);
            var n = $(this).attr('name');
            var x = $(this).data('type');
            n += x == "Lookup" ? "Id" : "";

            if(itemFound[0][n]){  
                switch (x) {
                    case 'DateTime':
                        field.val(formatDate(itemFound[0][n]));
                        break;
                    case 'Lookup':
                        field.val(itemFound[0][n]);
                        break;
                    case 'Boolean':
                        field.attr("checked", itemFound[0][n]);
                        break;
                    default:
                        field.val(itemFound[0][n]);
                        break;
                }
            }
        }); //END MAIN LOOP
    }

    function getItemById (id){
		var endpoint = "/_api/web/lists/getbytitle('" + listName + "')/Items?";
		endpoint = _spPageContextInfo.webAbsoluteUrl + endpoint;     
		endpoint += "&$filter=(ID eq '" + id + "')";
        endpoint += "&$expand=AttachmentFiles";
        
        var ajax = $.ajax({
			url: endpoint,
			method: "GET",
			headers: { "Accept": "application/json; odata=verbose" }
        });
        
		return ajax;
    }

    function getListType(){
        var endpoint = "/_api/web/lists/getbytitle('" + listName + "')?$select=ListItemEntityTypeFullName";
        var ajax = $.ajax({
            url: _spPageContextInfo.webAbsoluteUrl + endpoint,
            type: "GET",
            contentType: "application/json;odata=verbose", 
            headers: {
            "Accept": "application/json;odata=verbose",
            "X-RequestDigest": $("#__REQUESTDIGEST").val()
            },      
            error: function (data) {    
                showError(parseAjaxError(data));
            }
        });
        return ajax;
    }

    function urlParam (name){
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results==null){
           return null;
        }
        else{
           return decodeURI(results[1]) || 0;
        }
    }

    function resetErrors() {
        $(selectorString + " *").removeClass('hasError');
        $(selectorString + ' .error').remove();
    }

    /************END VALIDATE & SUBMIT FIELDS************/

    return {
        buildForm: buildForm,
        run: run
    };
}