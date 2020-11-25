({
	myAction : function(component, event, helper) {
		
	},
     doInit: function(component, event, helper) {
    //helper.getParentId(component);
    var evt = $A.get("e.force:navigateToComponent");
    evt.setParams({
      componentDef : "c:contactNewOverrideLwc",
      //cmponentAttributes: {
        //parentRecordId : component.get("v.parentRecordId")
      //}
    });
    evt.fire();
  }
})