({
	doInit : function(component, event, helper) {
		var myPageRef = component.get("v.pageReference");
    	var recordId = myPageRef.state.c__recordId;        
        console.log('myPageRef=='+myPageRef);
        console.log('myPageRef2=='+JSON.stringify(myPageRef));
        
    	component.set("v.recordId", recordId);
	},
    reInit : function(component, event, helper) {
         console.log('IN REINIT THANKS');
        $A.get('e.force:refreshView').fire();
    }
})