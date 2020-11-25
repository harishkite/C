({
	doInit : function(component, event, helper) {
        console.log('In DOINIT');
		var myPageRef = component.get("v.pageReference");
    	var recordId = myPageRef.state.c__recordId;
        var operation = myPageRef.state.c__operation;
        console.log('myPageRef=='+myPageRef);
        console.log('myPageRef2=='+JSON.stringify(myPageRef));
        
    	component.set("v.recordId", recordId);
        component.set("v.operation", operation);
	},
    reInit : function(component, event, helper) {
         console.log('IN REINIT THANKS');
        $A.get('e.force:refreshView').fire();
    }
})