({
    onInit : function(cmp, event, helper) {
    var recordId = cmp.get("v.recordId");

    var pageReference = {    
                            "type": "standard__recordPage",
                            "attributes": {
                                "recordId": recordId,
                                "actionName": "view"
                            },
                            "state":{
                                "nooverride":"1"
                            }
                        };

    var navService = cmp.find("navService");

    navService.navigate(pageReference);

    pageReference.attributes.actionName = "view";

    navService.navigate(pageReference);

}
})