({
    doInit : function(component, event, helper) 
    {   
        var errorMsgLabel =  $A.get("$Label.c.TestLink_Error_message");
        var errormsgs = errorMsgLabel.split("##");
        var ResSFQuoteId;
        var Restotal;
        console.log("pagereference=="+JSON.stringify(component.get("v.pageReference")));
        if(component.get("v.recordId")=="" && component.get("v.pageReference")!=null && component.get("v.pageReference")!="")
        {            
        	var myPageRef = component.get("v.pageReference");
            ResSFQuoteId = myPageRef.state.c__SFQuoteId;
            Restotal = myPageRef.state.c__total;       
            console.log('myPageRef=='+myPageRef);
            console.log('myPageRef2=='+JSON.stringify(myPageRef));    
        }
        else if(component.get("v.recordId")!="" && component.get("v.recordId")!="undefined" && component.get("v.recordId").startsWith("a0M"))
        {
            var cmpTarget = component.find('spinnnerDiv');
        	$A.util.addClass(cmpTarget, 'modalcss');
            ResSFQuoteId=component.get("v.recordId")+"1";
        }
        var quoteid;
        var runLineItemAPI=true;
        console.log('ResSFQuoteId=='+ResSFQuoteId);
        if(ResSFQuoteId!='undefined' && ResSFQuoteId!=null && ResSFQuoteId!='' && ResSFQuoteId.startsWith('a0M')==true)
        {
            if(ResSFQuoteId.length<18)
            {
                quoteid=ResSFQuoteId.substring(0,15);    
                component.set("v.quoteid",quoteid);
                if(ResSFQuoteId.substring(15,16)=='1')
                {
                    runLineItemAPI=true;
                }
                else
                {
                    runLineItemAPI=false;
                }
            }
            else if(ResSFQuoteId.length>18)
            {
                quoteid=ResSFQuoteId.substring(0,18);
                component.set("v.quoteid",quoteid);
                if(ResSFQuoteId.substring(18,19)=='1')
                {
                    runLineItemAPI=true;
                }
                else
                {
                    runLineItemAPI=false;
                }    
            }
            //CALLOUT START
            console.log('quoteid'+quoteid);
            var quoteRecord;
            var erapidqtno;
            var action = component.get("c.quoteAllFields");
            action.setParams({ "quoteId" : quoteid });            
            action.setCallback(this, function(response) {
                var state = response.getState();                
                console.log('state=='+state);
                if (state == "SUCCESS") {
                    console.log('retval=='+JSON.stringify(response.getReturnValue()));
                    quoteRecord = response.getReturnValue();
                    console.log('quoteRecord=='+quoteRecord);
                    console.log(response.getReturnValue().Erapid_Quote_no__c);
                    erapidqtno = response.getReturnValue().Erapid_Quote_no__c;
                    console.log('erapidqtno=='+erapidqtno);
                    helper.lineItemAPICallout(component,erapidqtno,quoteid);
                }                
                else if (state=="ERROR"){                    
                    console.log(state);                    
                    component.set("v.hasError",true);               
                    var errors = action.getError();
                    component.set("v.errorMessage",errormsgs[0]+' '+errors[0].message);
                }           
                else
                {
                    console.log(state);                    
                    component.set("v.errorMessage",errormsgs[0]);
                }
            });            
            $A.enqueueAction(action);
            
            //$A.enqueueAction(calloutAction);
            
            
        }
        else
        {
            component.set("v.hasError",true);               
            //var errors = action.getError();
            component.set("v.errorMessage",errormsgs[0]);
        }
        //component.set("v.recordId", recordId);
        //component.set("v.operation", operation);            
    },
    navigateToQuote:function(component, event, helper) {
        helper.redirectToQuote(component);
    },
     // function automatic called by aura:waiting event  
    showSpinner: function(component, event, helper) {
        // remove slds-hide class from mySpinner
        var spinner = component.find("mySpinner");
        $A.util.removeClass(spinner, "slds-hide");
    },
     
    // function automatic called by aura:doneWaiting event 
    hideSpinner : function(component,event,helper){
        // add slds-hide class from mySpinner    
        var spinner = component.find("mySpinner");
        $A.util.addClass(spinner, "slds-hide");
    }
    
    
})