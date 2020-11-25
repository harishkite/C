({
	init : function(component, event, helper) {
		var pageReference = component.get("v.pageReference");
        console.log('pageReference.state=='+pageReference.state);
		//component.set("v.accountName", pageReference.state);
	}
})