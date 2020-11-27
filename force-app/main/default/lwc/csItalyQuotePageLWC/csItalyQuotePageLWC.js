import { LightningElement,track,api ,wire } from 'lwc';
import { CurrentPageReference, NavigationMixin } from 'lightning/navigation';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';//logged in User
import NAME_FIELD from '@salesforce/schema/User.Name';
//import PRODUCT_ID_CSOPP from '@salesforce/schema/C_S_Opportunity__c.CS_Product_Added__c';
import PROFILE_NAME from '@salesforce/schema/User.Profile.Name';
import populateQuoteFields from '@salesforce/apex/quoteLightningUtility.populateQuoteFields';
import quoteAllFields from '@salesforce/apex/quoteLightningUtility.quoteAllFields';
import erapidCall from '@salesforce/apex/quoteLightningUtility.callErapidWebService';
import { refreshApex } from '@salesforce/apex';
import multiquotecreation from '@salesforce/apex/quoteLightningUtility.multiQuoteCreation';
import multiquotecreationcallout from '@salesforce/apex/quoteLightningUtility.callErapidWebServiceMultiple';
/*---IMORTING CUSTOM LABELS FOR TRANSLATIONS-----START---*/
//Please Select Rep and Customer Information to Create Quote
import REP_CUST_WARNING from '@salesforce/label/c.ADS_Cranford_Poland_New_Quote_Creation_Error';
import Save from '@salesforce/label/c.Save';
import Cancel from '@salesforce/label/c.Cancel';
const CSOPP_FIELDS = [
    'C_S_Opportunity__c.Name',
    'C_S_Opportunity__c.Project__c',
    'C_S_Opportunity__c.Opportunity_Name__c',
    'C_S_Opportunity__c.CS_Product_Added__c'    
];
export default class CsItalyQuotePageLWC extends NavigationMixin(LightningElement) {
    //Custom Labels import
    labels = {REP_CUST_WARNING,Cancel,Save};
    /*--For Notes---*/
    @track isNotesModalOpen = false;
    @track notespopupheader = '';
    @track profilename;
    @track notetable;
    @track notevalue;
    @track productid;    
    fillquotefields = true;
    
    showQualificationNotes()
    {
        this.isNotesModalOpen = true;
        this.notespopupheader = 'Select Qualification Notes';
        this.notetable = 'CS_QLF_NOTES';
        //const noteval=this.template.querySelector('[data-element="qlfnotes"]');
        //console.log('event=='+JSON.stringify(event))
        //console.log('selected Notes=='+this.template.querySelector('[data-element="qlfnotes"]').value);
        this.notevalue = this.template.querySelector('[data-element="qlfnotes"]').value;
    }
    showExclusionNotes()
    {
        this.isNotesModalOpen = true;
        this.notespopupheader = 'Select Exclusion Notes';
        this.notetable = 'CS_EXC_NOTES';
        this.notevalue = this.template.querySelector('[data-element="excnotes"]').value;
    }
    closeModal()
    {
        this.isNotesModalOpen = false;
    }
    submitNotes()
    {
        this.fillquotefields=false;
        //console.log('in submitNotes=='+this.template.querySelector('c-quote-notes-selection-l-w-c').selectednotes());
        var notesinput = this.template.querySelector('c-quote-notes-selection-l-w-c').selectednotes();
        this.isNotesModalOpen = false;
        console.log('retObj'+notesinput.notetablename+'=='+notesinput.selectednotes);
        if(notesinput.notetablename=='CS_QLF_NOTES')
        {
            //this.template.querySelector('[data-element="qlfnotes"]').reset();
            //console.log('notesinput=='+this.template.querySelector('[data-element="qlfnotes"]').value +'='+ notesinput.selectednotes);
            this.template.querySelector('[data-element="qlfnotes"]').value = notesinput.selectednotes;
            //this.qlfnote = notesinput.selectednotes;
            //console.log('notesinput=after=='+this.template.querySelector('[data-element="qlfnotes"]').value);
        }
        if(notesinput.notetablename=='CS_EXC_NOTES')
        {
            this.template.querySelector('[data-element="excnotes"]').value = notesinput.selectednotes;
        }
        //console.log('qlfquuu=='+this.template.querySelector('[data-element="qlfnotes"]'));
        //vat inputfield = this.template.querySelector('[data-element="qlfnotes"]');
        
    }    
    /*---Get Logged IN User Name---*/
    @track loggedinusername;
    @wire(getRecord, {
         recordId: USER_ID,
         fields: [NAME_FIELD,PROFILE_NAME]
     }) wireuser({
         error,
         data
     }) {
         if (error) {
            this.errorMessage = error ; 
         } else if (data) {
             //console.log('userdata=='+data);
             //console.log('userdata=='+JSON.stringify(data));
             this.loggedinusername = data.fields.Name.value;
             this.profilename = data.fields.Profile.value.fields.Name.value;
         }
     }
    
    @track loadingSpinner=false;
    @track spinnerCSS='spinnerClass'
    @track projectId;
    @track oppId;
    @api baseQuoteNumber;
    @track opportunityName;
    @track errorMessage='';
    @api recordId;
    //Get URL Params START
    currentPageReference;
    @wire(CurrentPageReference)
    setCurrentPageReference(currentPageReference) {
        this.currentPageReference = currentPageReference;

        if (this.connected) {
            // We need to have the currentPageReference, and to be connected before
            // we can use NavigationMixin
            this.generateUrls();
        } else {
            // NavigationMixin doesn't work before connectedCallback, so if we have 
            // the currentPageReference, but haven't connected yet, queue it up
            this.generateUrlOnConnected = true;
        }
    }        
    @api operation;
    /*get operation()
    {
        return this.currentPageReference.state.c__operation;
    }*/
    get isCopyOperation()
    {
        if(this.currentPageReference.state.c__operation=='Copy')
        {
            return true;
        }
        return false;
    } 
    
    @api quoteId;
    /*get quoteId()
    {
        //console.log('this.quoteid in csooo=='+this.currentPageReference.state.c__quoteId);
        if(this.currentPageReference.state.c__operation=='Edit')
        {
            return this.currentPageReference.state.c__quoteId;
        }
        return '';
    }
    //Get URL Params END  
    /*--Populate Selected Rep Customer Info from inside component--START--*/
    @track selectedRep;
    @track selectedCustomer;
    constructor()
    {
        super();
        //alert('constuctor');
        //this.loadingSpinner=false;
    }
    
    selectedrepinfo(event)
    {   
        this.fillquotefields=false;
        this.selectedRep = event.detail;
    }      
    selectedcustomerinfo(event)
    {
        this.fillquotefields=false;
        this.selectedCustomer = event.detail;
    }
    /*--Populate Selected Rep Customer Info from inside component--END----*/

    /*--GET CS Opp Data START--*/    
    @wire(getRecord, { recordId: '$oppId', fields: CSOPP_FIELDS}) csOpportunity
    ({data, error}) {
        if(data) {            
            this.projectId = data.fields.Project__c.value;
            if(this.operation=='New')
            {
                this.opportunityName = data.fields.Opportunity_Name__c.value;
            }            
            this.productid = data.fields.CS_Product_Added__c.value;
        }
    }
    /*--GET CS Opp Data END--*/
    @api operationOfQuote;
    connectedCallback()
    {           
        //this.loadingSpinner=!this.loadingSpinner
        this.errorMessage='';
        //console.log('errorMessage=='+this.errorMessage);
        //this.oppId = this.currentPageReference.state.c__oppId;
        //console.log('OPP ID in connecetedcallback=='+this.oppId);
        //this.operationOfQuote = this.currentPageReference.state.c__operation;
        //if(this.recordId!=null && this.recordId!='undefined' && this.recordId.startsWith('a0d'))
        if(this.recordId && this.recordId.startsWith('a0d'))
        {
            this.oppId = this.recordId;
        }
        //if(this.recordId && this.operation=='Edit' && this.recordId!=null && this.recordId!='undefined' && this.recordId.startsWith('a0M'))
        if(this.recordId && this.operation=='Edit' && this.recordId.startsWith('a0M'))
        {
            this.quoteId = this.recordId;
        }
        //console.log('connectedcallback=quoteid='+this.quoteId);        
        //console.log('connectedcallback=operation='+this.operation); 
        //console.log('connectedcallback=oppId='+this.oppId); 
        /*if(this.operation!='New')
        {
            this.fillQuoteFieldsInCopyAndAlternate();
        } */       
    }       
    renderedCallback() { 
        if(this.operation!='New' && this.fillquotefields)
        {
            this.fillQuoteFieldsInCopyAndAlternate();
        } 
        console.log('in renderedcallback');
    }
    fillQuoteFieldsInCopyAndAlternate()
    {
        //console.log('renderedCallback==this.loadingSpinner=='+this.loadingSpinner+'==');        
        const inputFields = this.template.querySelectorAll('lightning-input-field');
        /*--Populating Quote fields in Copy and Alternate Operation--START---*/
        console.log('this.recordId=='+this.recordId+'=END');
        //console.log('template==inputFields==='+JSON.stringify(inputFields));
        //if(this.recordId!=null && this.recordId!='undefined' && this.recordId.startsWith('a0M'))
        if(this.recordId && this.recordId.startsWith('a0M'))
        {
            //Below quoteAllFields methid is querying all quoute fields from Apex Controller and get result
            quoteAllFields({quoteId:this.recordId})
            .then(result => {          
                //console.log('resultonsave=ss2='+JSON.stringify(result));
                //Populating basequotenumber to send base Erapid Quote Number to Erapid callout 
                //Especially we are populating Alt doc number in Alternate operation
                this.baseQuoteNumber = result.Erapid_Quote_no__c;
                this.productid = result.Product_Id__c;
                if(this.operation!='New' && this.operation!='Copy')
                {
                    this.selectedRep = result.Account__c+'##'+result.Contact__c;
                    this.selectedCustomer = result.Account_Customer__c+'##'+result.Contact_customer__c;
                }                
                //console.log('passValuesToChildRepCust=='+this.selectedRep+'=='+this.selectedCustomer);
                if(this.operation!='New' && result.C_S_Opportunity__c)
                {
                    this.oppId = result.C_S_Opportunity__c;
                    //Custom Populating Qualification and Exclusion Notes as Inputfield is not supporting few things

                    if(result.Exclusion_Notess__c)
                    {
                        this.template.querySelector('[data-element="excnotes"]').value = result.Exclusion_Notess__c;
                    }
                    if(result.Qualificationn_Notes__c)
                    {                        
                        this.template.querySelector('[data-element="qlfnotes"]').value = result.Qualificationn_Notes__c;
                    }                    
                }        
                //console.log('inputfields filling=='+JSON.stringify(inputFields));        
                if (inputFields) {
                    inputFields.forEach(field => {
                        //console.log('inputFields for each field--'+field);
                        //Here we are populating lightnig record edit form Input fields with result
                        if(result.hasOwnProperty(field.fieldName))
                        {
                            field.value = result[field.fieldName];
                        }                    
                    });
                }
            })
            .catch(error => {
                console.log('error==populateQuoteFields=='+error);
                console.log('error populateQuoteFields=='+JSON.stringify(error));            
                this.errorMessage = JSON.stringify(error);
            });

        }         
        /*--Populating Quote fields in Copy and Alternate Operation---END---*/

    }
    /*---SAVE Quote START--*/
    saveQuote(event)
    {   
        event.preventDefault();   
        //Fill Qualification and Exclusion Notes-as we are not using inputfield because it wont support populating data using JS                            
        this.errorMessage='';
        let fields = event.detail.fields;                     
        var qlnotes = this.template.querySelector('[data-element="qlfnotes"]').value;   
        var exnotes = this.template.querySelector('[data-element="excnotes"]').value;                   
        //if(qlnotes!=null && qlnotes!='')
        if(qlnotes)
        {
            fields.Qualificationn_Notes__c = qlnotes;
        }
        //if(exnotes!=null && exnotes!='')
        if(exnotes)
        {
            fields.Exclusion_Notess__c = exnotes;
        }
        //SAVE START----//
        if(this.operation=='Copy')
        {
            var multirepcustlist = this.template.querySelector('c-quote-rep-customer-multi-selection').multirepcust();        
            //console.log('multirepcustlist.length=='+multirepcustlist);            
            
            //console.log('validation=='+this.validateQuoteFieldsCopy(multirepcustlist));
            if(this.validateQuoteFieldsCopy(multirepcustlist))
            {
                //console.log('validation success');
                //var resultOfQuote
                this.errorMessage='';
                this.loadingSpinner=!this.loadingSpinner;//Show Spinner on Quote Save
                multiquotecreation({repcustdata: JSON.stringify(multirepcustlist), quote: JSON.stringify(fields)})
                .then(result => {                                            
                    //console.log('=quotes-copy-insert=length='+result.length);
                    //console.log('=quotes-copy-insert=length=firstIndex=='+result[0]);
                    console.log('copyquoteIDs-afterinsert=='+JSON.stringify(result));
                    multiquotecreationcallout({copyids: result, operation: 'Copy',baseQuoteId:this.recordId})
                    .then(resultCallout => {                                              
                        //console.log('=2ndtimequotes-copy-insert=length=firstIndex=='+result[0]);
                        //console.log('result length=='+resultCallout.length);
                        this.errorMessage='';
                        console.log('copyquoteIDs-aftercallout=='+JSON.stringify(resultCallout));                    
                        if(result.length==1)
                        {
                            this.navigateToRecord('Quotes__c',result[0]);
                        }
                        else
                        {
                            this.navigateToRecord('C_S_Opportunity__c',this.oppId);
                        }                        
                    })
                    .catch(error => {
                        this.loadingSpinner=false;
                        console.log('In error==populatefields'+error);
                        console.log('error-afterRepInfoPopulate=='+JSON.stringify(error));            
                        this.errorMessage = JSON.stringify(error);
                    }); 
                })
                .catch(error => {
                    this.loadingSpinner=false;
                    console.log('In error==populatefields'+error);
                    console.log('error-afterRepInfoPopulate=='+JSON.stringify(error));            
                    this.errorMessage = JSON.stringify(error);
                }); 

            }
        }        
        //console.log('this.validateQuoteFields(event)=='+this.validateQuoteFields(event))
        if(this.operation!='Copy')//Validating Quote Fields
        {
            if(this.validateQuoteFields(event))
            {
                this.errorMessage='';
                this.loadingSpinner=!this.loadingSpinner;//Show Spinner on Quote Save
                //console.log('==Success Validation=='+this.baseQuoteNumber);            
                //let fields = event.detail.fields;   
                console.log('before populate rep cust=fields='+JSON.stringify(fields));         
                populateQuoteFields({quote: JSON.stringify(fields), repId:this.selectedRep, customerId:this.selectedCustomer, operation:this.operation, erapidquotenumber:this.baseQuoteNumber})
                .then(result => {                          
                    console.log('result-afterRepInfoPopulate=='+JSON.stringify(result));
                    fields = result;                             
                    //fields.Erapid_Quote_no__c='';
                    this.template.querySelector('lightning-record-edit-form').submit(fields);                
                })
                .catch(error => {
                    this.loadingSpinner=false;
                    console.log('In error==populatefields'+error);
                    console.log('error-afterRepInfoPopulate=='+JSON.stringify(error));            
                    this.errorMessage = JSON.stringify(error);
                }); 
            }
        }
    }    
    //Call Erapid webservice
    webserviceCallout(event)
    {
        event.preventDefault();
        console.log('callErapidWebServiceSTART=='+event.detail.id);
        erapidCall({quoteId: event.detail.id, operation: this.operation})
        .then(result => {
            console.log('callout-result=='+result);
            this.errorMessage='';
            this.navigateToRecord('Quotes__c',event.detail.id);
            
            //this.resetForm();
            //console.log(result);
        })
        .catch(error => {
            this.loadingSpinner=false;
            console.log("Error---"+error);
            console.log('Error-Stringify---'+JSON.stringify(error));
            this.errorMessage = JSON.stringify(error);
        });

    }
    navigateToRecord(sobjectname,redirectid)
    {   
        //resetForm();     
        this.loadingSpinner=!this.loadingSpinner;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                objectApiName: sobjectname,
                actionName: 'view',
                recordId: redirectid,
            },
        });
    }
    validateQuoteFields(event)
    {
        event.preventDefault();
        console.log('selectedRep=='+this.selectedRep);
        console.log('selectedCust=='+this.selectedCustomer);//this.slectedCustomer
        //if(this.selectedRep==undefined || this.selectedRep=='undefined' || this.selectedRep=='' || this.selectedCustomer==undefined || this.selectedCustomer=='undefined' || this.selectedCustomer=='')
        if(!this.selectedRep || !this.selectedCustomer)
        {
            this.errorMessage = this.labels.REP_CUST_WARNING;
            return false;
        }   
        return true;
    }
    validateQuoteFieldsCopy(multirepcustlist)
    {
        var validation = multirepcustlist.every(function(elem) {
            //console.log('elem=='+elem); //result: "My","name"
            console.log('elem==repid=='+elem.repid+"=check=");
            console.log('elem==customerid=='+elem.customerid);
            if (!elem.repid || !elem.customerid) 
            { 
                console.log("elem.repId=="+elem.repId+"=="+elem.customerid);
                return false;
            }
            return true;
        });
        console.log('validation=='+validation);
        if(!validation)
        {
            this.errorMessage = this.labels.REP_CUST_WARNING;
            return false;
        }
        else
        {
            this.errorMessage = '';
            return true;
        }
    }
    /*---SAVE Quote END--*/
    cancelRedirect()
    {
        //this.resetForm();
        var sobject;
        var redirectId;
        if(this.recordId && this.recordId!=null && this.recordId.startsWith('a0M'))
        {
            sobject='Quotes__c';
            redirectId = this.recordId;
        }
        else if(this.recordId && this.recordId!=null && this.recordId.startsWith('a0d'))
        {
            sobject='C_S_Opportunity__c';
            redirectId = this.recordId;
        }
        this.navigateToRecord(sobject,redirectId);
    }
    errorInForm(event)
    {
        console.log('error=='+JSON.stringify(event));
        console.log('error=='+JSON.stringify(event.detail));
    }
    //Resetting fields after form submission--START
    resetForm()
    {
        const inputFields = this.template.querySelectorAll(
            'lightning-input-field'
        );
        //console.log('IN RESET');
        if (inputFields) {
            inputFields.forEach(field => {
                field.reset();
            });
        }
        refreshApex();
    }    
    //Resetting fields after form submission--END

}