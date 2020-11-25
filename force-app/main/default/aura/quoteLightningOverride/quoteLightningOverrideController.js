({
    doInit : function(component, event, helper) 
    {   
        //Get Profile Name START
        console.log('DO INIT--in extended aua');
        //console.log("component="+JSON.stringify(component));
        if(component.get("v.recordId")!="" && component.get("v.recordId")!=null)
        {
            console.log("component==recordid=="+component.get("v.recordId"));
            var action = component.get("c.quotePageBasedOnUser");
            var pagename='';
            action.setCallback(this, function(response){
                console.log("response=="+JSON.stringify(response));
                var state = response.getState();
                console.log("state=="+state);
                if (state === "SUCCESS") {
                    pagename = response.getReturnValue();
                    console.log("response.getReturnValue()=="+response.getReturnValue());
                    
                    if(response.getReturnValue()!='' && response.getReturnValue()!='undefined')
                    {
                        component.set("{!v.redirectPageName}",pagename);
                        console.log("in NAV If"+pagename);
                        var navService = component.find("navService");
                        var pageReference = {
                            "type": "standard__component",
                            "attributes": {
                                "componentName": "c__"+pagename
                            }, 
                            "state": {
                                "c__recordId":component.get("v.recordId"),
                                "c__operation":component.get("v.operation")
                            }
                        };
                        console.log("pageReference=="+JSON.stringify(pageReference));
                        navService.navigate(pageReference);
                        /*var evt = $A.get("e.force:navigateToComponent");
                    evt.setParams({
                        componentDef : "c:"+pagename,
                        componentAttributes: {
                            recordId:component.get("v.recordId"),
                            operation:component.get("v.operation")
                        }
                    });
                    console.log("evt=="+JSON.stringify(evt));
                    console.log("operation=="+component.get("v.operation"));
                    evt.fire();*/
                    }
                }
            });
            $A.enqueueAction(action);
            //Get Profile Name END
            console.log("pagname=="+pagename);            
        }
        else
        {
            component.set("v.hasError",true);
            component.set("v.errorMessage",$A.get("$Label.c.Check_Permission_Quote_Error"));            
        }
        
    }
    
})