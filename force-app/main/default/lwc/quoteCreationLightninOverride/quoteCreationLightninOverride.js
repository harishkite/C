import { ShowToastEvent } from 'lightning/platformShowToastEvent';
    import { LightningElement, wire, api, track } from 'lwc';
    import { NavigationMixin } from 'lightning/navigation';
    import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
    import QUOTEOBJECT from '@salesforce/schema/Quotes__c';
    import { refreshApex } from '@salesforce/apex';    
    import userDetails from '@salesforce/apex/quoteCreationOverride.userDetails';
    import quoteData from '@salesforce/apex/quoteCreationOverride.quoteData';
    import navigatePageName from '@salesforce/apex/quoteCreationOverride.redirectQuotePage';
    //import populateQuoteFields 
    const QUOTE_FIELDS = [
        'Quotes__c.Name',
        'Quotes__c.C_S_Opportunity__c'
    ];
    export default class NavigateToQuotePage extends NavigationMixin(LightningElement) {    
    @api operation;  
    @api oppId;
    @api opportunityId;
    @api projectId;
    @api recordId;
    @api sObjectName;
    @api objectApiName;
    @api quoteId;
    @track errorMessage;
    @api returnURL;
    @track fieldsquote;
    /*--GET CS Opp Data START--*/
    
    @wire(getRecord, { recordId: '$recordId', fields: QUOTE_FIELDS }) quoteData1;
    /*({data, error}) {
        if(data) {
            //this.projectId = data.fields.Project__c.value;
            console.log('data=='+JSON.stringify(data));
            this.opportunityId = data.fields.C_S_Opportunity__c.value;
        }
    }
    /*--GET CS Opp Data END--*/
    constructor()
    {
        super();        
        /*console.log('in constructor');
        console.log('this is the one=='+this.vaidateBeforeQuoteUI());
        if(this.vaidateBeforeQuoteUI()=='true')
        {
            this.onloadFunction();
        }*/
        
    }    
    @wire (quoteData, {quoteid:'%recordId'}) qdt
    ({data, error}) {
        if(data) {
            console.log('result=='+JSON.stringify(result));
            this.opportunityId = result.C_S_Opportunity__c;
        }
    }
    connectedCallback()
    {
        console.log('in connectedCallback==');             
        //this.fieldsquote = ['Quotes__c.Name', 'Quotes__c.C_S_Opportunity__c'];
        
        if(this.recordId!=null && this.recordId!='' && this.recordId!='undefined' && this.recordId.startsWith('a0M')){

        
            /*quoteData({quoteid:this.recordId})
            .then(result => {                
                console.log('result=='+JSON.stringify(result));
                this.opportunityId = result.C_S_Opportunity__c;
                
            })
            .catch(error => {
                this.error = error;                
                console.log("in error"+JSON.stringify(error));
                
            });   */
        }
        //console.log('this.quotedata-rendercallb='+JSON.stringify(this.quoteData1));
        console.log('in renderedCallback');             
        //this.quotedatafromrecordId();
        
        //console.log('quoteData=='+JSON.stringify(this.quoteData));
        //console.log('this is the one=='+this.vaidateBeforeQuoteUI());        
        if(this.vaidateBeforeQuoteUI()=='')
        {
            this.onloadFunction();
        }
        else
        {
            this.errorMessage = this.vaidateBeforeQuoteUI();
        }    
    
    }
    renderedCallback()
    {
        
    }
    quotedatafromrecordId()
    {
        
        return true;
    }
    vaidateBeforeQuoteUI()
    {      
        console.log('in validation method');
        console.log('this.recordId=='+this.recordId);
        var errorMsg='';
        if(this.recordId=='' || this.recordId=='undefined' || this.recordId==undefined)
        {
            errorMsg = 'Navigate to CS Opportunity to create Quote';            
        }
        else
        {
            console.log('in else');
            errorMsg = '';            
        }
        return errorMsg;
        
    }
    //connectedCallback()
    onloadFunction()
    {
        //console.log('this.quotedatafromrecordId()=='+this.quotedatafromrecordId());
        if(this.operation!='New')
        {
            //this.oppId = this.opportunityId;  
            this.quoteId=this.recordId;            
            
        }
        if(this.operation=='New')
        {
            this.oppId = this.recordId;
        }
        console.log('onLoadFunction');
        console.log('OppId=='+this.oppId);
        //console.log('csOppID=='+csOppID);
        //console.log('sObjectName=='+this.sObjectName);
        //console.log('objectApiName=='+this.objectApiName);
        //console.log('recordId=='+this.recordId);                
        console.log();
        userDetails()
        .then(result => {        
            console.log("result=="+result.Profile.Name);            
            /*----Navigate Logic---START----*/
            navigatePageName({profileName:result.Profile.Name})
            .then(result => {
                console.log('result=='+result);
                console.log("this.quoteId=="+this.quoteId);                
                console.log("this.opppID=="+this.opportunityId);
                if(this.operation!='New')
                {
                    this.oppId = this.opportunityId;
                }
                this[NavigationMixin.Navigate]({
                    "type": "standard__component",
                    "attributes": {
                        "componentName": "c__"+result   
                    },
                    "state": {
                        c__opportunityName: "testcsopp",
                        c__operation: this.operation,                        
                        c__quoteId: this.quoteId,
                        c__oppId: this.oppId
                    }
                });
            })
            .catch(error => {
                this.error = error;                
                console.log("in error"+error);
            });                            
            /*----Navigate Logic---END------*/
        })
        .catch(error => {
            this.error = error;            
            console.log("in error"+error);
        });        
    }
    cancelClick()
    {

    }      
}