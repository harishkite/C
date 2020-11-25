import { LightningElement,track,api ,wire } from 'lwc';
import { CurrentPageReference, NavigationMixin } from 'lightning/navigation';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import USER_ID from '@salesforce/user/Id';//logged in User
import NAME_FIELD from '@salesforce/schema/User.Name';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import quoteAllFields from '@salesforce/apex/quoteLightningUtility.quoteAllFields';
import emailTemplateData from '@salesforce/apex/emailQuoteUtility.emailTemplateData';
import fetchQuoteDocsFromServer from '@salesforce/apex/emailQuoteUtility.fetchQuoteDocsFromServer';
import sendEmail from '@salesforce/apex/emailQuoteUtility.sendEmail';
import emailTemplates from '@salesforce/apex/emailQuoteUtility.emailTemplateOptions';
import defaultQuoteTypes from '@salesforce/apex/emailQuoteUtility.defaultQuoteTypes';
import emailQuoteSetting from '@salesforce/apex/emailQuoteUtility.emailQuoteSetting';
import bccRecipientsList from '@salesforce/apex/emailQuoteUtility.bccRecipientsList';
//Import custom labels--
import Selectfileserapid from '@salesforce/label/c.Select_the_files_from_Erapid_system';
import default_quote_type from '@salesforce/label/c.default_quote_type';
import Quote_Type from '@salesforce/label/c.Quote_Type';
import Quote_Type_1 from '@salesforce/label/c.Quote_Type_1';
import Quote_Type_2 from '@salesforce/label/c.Quote_Type_2';
import Quote_Type_3 from '@salesforce/label/c.Quote_Type_3';
import Quote_Type_4 from '@salesforce/label/c.Quote_type_4';
import Quote_Type3 from '@salesforce/label/c.Quote_Type3';
import Attachment from '@salesforce/label/c.Attachment';
import As_a_URL from '@salesforce/label/c.As_a_URL';
import Template from '@salesforce/label/c.Template';
import File_Attachment from '@salesforce/label/c.File_Attachment';
import None from '@salesforce/label/c.None';
import Subject from '@salesforce/label/c.Subject';
import Email_Body from '@salesforce/label/c.Email_Body';
import Next from '@salesforce/label/c.Next';
import Recipients from '@salesforce/label/c.Recipients';
import CC from '@salesforce/label/c.CC';
import BCC from '@salesforce/label/c.BCC';
import Send_Email from '@salesforce/label/c.Send_Email';
import Select_the_files from '@salesforce/label/c.Select_the_files_from_Erapid_system';
import LINK_OR_ATTACH_TEXT from '@salesforce/label/c.LINK_OR_ATTACH_TEXT';

export default class EmailQuoteDocumentsLWC extends NavigationMixin(LightningElement) {
    ////////////////////////CUSTOM LOOKUP FOR RECIPIENTS BLOCK JS CODE START///////////////////////////////
    @track selectedItemsToDisplay = ''; //to display items in comma-delimited way
    @track values = []; //stores the labels in this array
    @track isItemExists = false; //flag to check if message can be displayed
    selectedRecipients;//Email Ids - To in Email
    selectedCcRecipients;//Email Ids - CC in Email
    selectedBccRecipients;////Email Ids - BCC in Email
    //captures the retrieve event propagated from lookup component
    /////////////TO Recipients//////////////////////////////
    selEmailConList;
    selRecipientsHandler(event){
        //console.log('event=='+event.detail+'=='+JSON.stringify(event.detail));
        let args = JSON.parse(JSON.stringify(event.detail.arrItems));
        let selectedToEmails = event.detail.dataMap;
        console.log('Selected Items=='+args+'=='+JSON.stringify(args));
        var conEmailMap=[];
        args.forEach(function (arr) {
            console.log('arra=='+JSON.stringify(arr));            
            conEmailMap.push(arr.value);       
        });
        this.selEmailConList = conEmailMap;
        //console.log('Selected Items=='+selectedToEmails);
        selectedToEmails.forEach(function (arrayItem) {
            console.log('arrayItem=='+arrayItem);
                   
        });
        this.selectedRecipients = selectedToEmails;
        this.displayItem(args);        
    }
    //captures the remove event propagated from lookup component
    delRecipientsHandler(event){
        let args = JSON.parse(JSON.stringify(event.detail.arrItems));
        var compName=event.target.dataset.element;
        //console.log('event='+event.target+'=='+JSON.stringify(event.target.dataset.element));
        //console.log('=removeItem='+event.detail.removeItem);
        //console.log('=BEFORE=this.defaultToRecipients=='+this.defaultToRecipients+'=='+JSON.stringify(this.defaultToRecipients));        
        if(this.quoteIdEmailMap)
        {
            console.log('In IF');
            if(this.quoteIdEmailMap.has(event.detail.removeItem))
            {
                console.log('In IF2'+event.detail.removeItem+'=='+ this.quoteIdEmailMap.get(event.detail.removeItem));
                if(compName=='tocomponent')
                {
                    this.selectedRecipients = this.selectedRecipients.filter(e => e != this.quoteIdEmailMap.get(event.detail.removeItem));
                    this.selEmailConList = this.selEmailConList.filter(e => e != event.detail.removeItem);
                }
                if(compName=='cccomponent')
                {
                    this.selectedCcRecipients = this.defaultCcRecipients.filter(e => e != this.quoteIdEmailMap.get(event.detail.removeItem));
                }
                if(compName=='bcccomponent')
                {
                    this.selectedBccRecipients = this.defaultBccRecipients.filter(e => e != this.quoteIdEmailMap.get(event.detail.removeItem));
                }
                
            }
        }
        console.log('=AFTER=this.selectedToEmails=='+this.selectedRecipients);
        console.log('=AFTER=this.defaultCcRecipients=='+this.defaultCcRecipients);
        console.log('=AFTER=this.defaultBccRecipients=='+this.defaultBccRecipients);
        this.displayItem(args);
    }
    /////////////CC Recipients//////////////////////////////    
    selCcRecipientsHandler(event){
        //console.log('event=='+event.detail+'=='+JSON.stringify(event.detail));
        let args = JSON.parse(JSON.stringify(event.detail.arrItems));
        let selectedToEmails = event.detail.dataMap;
        //console.log('Selected Items=='+args);
        //console.log('Selected Items=='+selectedToEmails);
        selectedToEmails.forEach(function (arrayItem) {
            console.log('arrayItem=='+arrayItem);
                   
        });
        this.selectedCcRecipients = selectedToEmails;
        this.displayItem(args);        
    }
    //captures the remove event propagated from lookup component
    delCcRecipientsHandler(event){
        let args = JSON.parse(JSON.stringify(event.detail.arrItems));
        this.displayItem(args);
    }
    /////////////BCC Recipients//////////////////////////////
    selBccRecipientsHandler(event){
        //console.log('event=='+event.detail+'=='+JSON.stringify(event.detail));
        let args = JSON.parse(JSON.stringify(event.detail.arrItems));
        let selectedToEmails = event.detail.dataMap;
        //console.log('Selected Items=='+args);
        //console.log('Selected Items=='+selectedToEmails);
        selectedToEmails.forEach(function (arrayItem) {
            console.log('arrayItem=='+arrayItem);
                   
        });
        this.selectedBccRecipients = selectedToEmails;
        this.displayItem(args);        
    }
    //captures the remove event propagated from lookup component
    delBccRecipientsHandler(event){
        let args = JSON.parse(JSON.stringify(event.detail.arrItems));
        this.displayItem(args);
    }
    //displays the items in comma-delimited way
    displayItem(args){
        this.values = []; //initialize first
        args.map(element=>{
            this.values.push(element.label);
        });

        this.isItemExists = (args.length>0);
        this.selectedItemsToDisplay = this.values.join(', ');
    }
    ////////////////////////CUSTOM LOOKUP JS CODE END///////////////////////////////
    //Custom Labels import START
    labels = {Attachment,As_a_URL,File_Attachment,Selectfileserapid,default_quote_type,LINK_OR_ATTACH_TEXT,
                Subject,Email_Body,Template,Quote_Type,Quote_Type_1,Quote_Type_2,Select_the_files,
                Quote_Type_3,Quote_Type_4,Quote_Type3,None,Next,Recipients,CC,BCC,Send_Email};
    //Custom Labels import END
    loadingSpinner=false;
    errorMessage='';
    spinnerCSS='spinnerClass';
    
    showSendEmail=false;
    showNext=true;

   
    productCode;
    quoteFieldsData;
    
   
    @api recordId;
    selectedQuoteType;//Default value 
    selectedQuoteTypeLabel;//Label of value 
    //selectedQuoteTypeVal;
    quoteTypes=[];
    /*@track quoteTypes = [
        {label: this.labels.Quote_Type_1, value: "1"},
        {label: this.labels.Quote_Type_2, value: "2"},
        {label: this.labels.Quote_Type3, value: "3"},
        {label: this.labels.Quote_Type_4, value: "4"}
    ];*/
    
    @track defaultQuoteType;
    @track selecteddefaultTyeps=[];//Array type of selected values in Dual Picklist box
    @track defaultQtTypeOptions = [];
    showExtraDocsSection=false;
    

    attachmentType='ATT';//default value set
    //selectedAttachmentType;
    @track attachmentList = [
        {label:this.labels.As_a_URL,value:"URL"},
        {label:this.labels.File_Attachment,value:"ATT"}
    ];
    handleAttachmentType(event)
    {
        this.attachmentType = event.detail.value;
    }

    @track selectedTemplate;
    @track emailTemplateOptions = [];
    
    @wire(emailTemplates)
    emailTemplates(result)
    {
        console.log('result='+result+'=='+JSON.stringify(result));
        console.log('result='+result.data+'=='+JSON.stringify(result.data));
        
        if (result.data) {
            //mapData = [];
            var opts = result.data;
            for(var key in opts){
                console.log('key=='+key+'=='+opts[key]);
                const tempOpt = {
                    label: opts[key],
                    value: key
                };
                // this.selectOptions.push(option);
                this.emailTemplateOptions = [ ...this.emailTemplateOptions, tempOpt ];                
            }
        }
    }
    
    emailSubject;
    emailBody;

    @track emailAttachmentsList;    
    

    constructor()
    {
        super();
    }

    bccRecipientList;
    bccRecipientsData(prodid,sbucode)
    {
        var bccData=[];
        bccRecipientsList({product:prodid,BUName:sbucode})
        .then(result => {         
            //console.log('resuly=='+result+'=='+JSON.stringify(result));
            if (result) {
                //mapData = [];
                var opts = result;
                opts.forEach(function (arrayItem) {            
                    bccData.push(arrayItem);
                });
                this.bccRecipientList=bccData;
                console.log('this.bccRecipientList='+this.bccRecipientList);
                this.template.querySelector('[data-element="bcccomponent"]').showDefaultRecords=this.bccRecipientList;
            }
         })
        .catch(error => {
            this.loadingSpinner=false;
            console.log('error  types=='+error);            
            //this.errorMessage = JSON.stringify(error);
        });
    }
    fillDefaultTypes(prodid,sbucode)
    {
        //console.log('in method');
        defaultQuoteTypes({productid:prodid,sbucode:sbucode})
            .then(result => {         
                //console.log('resuly=='+result+'=='+JSON.stringify(result));
                if (result) {
                    //mapData = [];
                    var opts = result;
                    for(var key in opts){
                        //console.log('key=='+key+'=='+opts[key]);
                        const tempOpt = {
                            label: opts[key],
                            value: key
                        };
                        // this.selectOptions.push(option);
                        this.defaultQtTypeOptions = [ ...this.defaultQtTypeOptions, tempOpt ];                
                    }
                }
             })
            .catch(error => {
                this.loadingSpinner=false;
                console.log('error fill default types=='+error);            
                //this.errorMessage = JSON.stringify(error);
            });
    }
    ////////////////SHOW DEFAULT RECIEPIENTS START//////////////////////
    defaultToRecipients;
    defaultCcRecipients;
    defaultBccRecipients;
    
    defaultRecipients(quoteData)
    {
        var defToRecipients=[];
        var defCcRecipients=[];
        var defToEmails=[];
        var defCcEmails=[];
        if(quoteData.Contact_customer__r)
        {            
            var selConIdList=[];
            defToRecipients = [
                {label: quoteData.Contact_customer__r.Name, value: quoteData.Contact_customer__c}
            ];
            this.quoteIdEmailMap.set(quoteData.Contact_customer__r.Id,quoteData.Contact_customer__r.Email);            
            this.template.querySelector('[data-element="tocomponent"]').setDefaultShowValues(defToRecipients,this.quoteIdEmailMap);
            defToEmails.push(quoteData.Contact_customer__r.Email);
            //this.defaultToRecipients = defToEmails;
            this.selectedRecipients = defToEmails;            
            selConIdList.push(quoteData.Contact_customer__r.Id);
            this.selEmailConList = selConIdList;
        }
        if(quoteData.Contact__r)
        {            
            defCcRecipients = [
                {label: quoteData.Contact__r.Name, value: quoteData.Contact__c}
            ];     
            this.quoteIdEmailMap.set(quoteData.Contact__r.Id,quoteData.Contact__r.Email);
            this.template.querySelector('[data-element="cccomponent"]').setDefaultShowValues(defCcRecipients,this.quoteIdEmailMap);             
            defCcEmails.push(quoteData.Contact__r.Email);
            this.selectedCcRecipients = defCcEmails;
            console.log('onload=='+this.selectedCcRecipients);
        }
    }
    quoteIdEmailMap = new Map();//Map to store SObject data apart from Label and Value        
    ////////////////SHOW DEFAULT RECIEPIENTS END////////////////////////    
    fillEmailQuoteType(res)
    {
        //console.log('in fillEmailQuoteType=='+JSON.stringify(res));
        emailQuoteSetting({
            productId:res.Product_Id__c,
            fieldType:'Quote Type',
            quoteNo:res.Erapid_Quote_no__c,
            BUName:res.RecordType.Name
            })
            .then(result => { 
                
                if (result) {
                    //mapData = [];
                    var opts = result;
                    for(var key in opts){
                        console.log('key=='+key+'=='+opts[key]);
                        const tempOpt = {
                            label: opts[key],
                            value: key
                        };
                        // this.selectOptions.push(option);
                        if(opts[key]=='File Pdf')
                        {
                            this.selectedQuoteType=key;
                            this.selectedQuoteTypeLabel =  opts[key];
                        }
                        this.quoteTypes = [ ...this.quoteTypes, tempOpt ];                
                    }
                }
            })
            .catch(error => {
                console.log('error==populateQuoteFields=='+error);
                console.log('error populateQuoteFields=='+JSON.stringify(error));            
                this.errorMessage = JSON.stringify(error);
            });         
    }
    
    bccDefaultValues=true;//SHOW ONFOUS to Display BCC with default values in the list
    connectedCallback()
    {        
        this.errorMessage='';        
        //Get all Quote fields data required for Email Quote like Default To/CC recipients 
        quoteAllFields({quoteId:this.recordId})
            .then(result => {          
                //console.log('result=quotedata='+JSON.stringify(result));
                this.productCode = result.Product_Id__c;
                this.fillDefaultTypes(result.Product_Id__c,result.RecordType.Name);
                this.fillEmailQuoteType(result);
                this.bccRecipientsData(result.Product_Id__c,result.RecordType.Name);
                this.quoteFieldsData = result;
                this.emailSubject = 'Erapid Quote no: '+this.quoteFieldsData.Erapid_Quote_no__c+' for '+this.quoteFieldsData.Quote_Name__c+' ('+this.quoteFieldsData.C_S_Opportunity__r.Name+')';
                this.defaultRecipients(result);                
                //this.quoteIdEmailMap.set(resElement.Id,result.Email);//To get Email Id based on ID
                //result.Contact__c;
                //result.Contact_customer__c;                
            })
            .catch(error => {
                console.log('error==populateQuoteFields=='+error);
                console.log('error populateQuoteFields=='+JSON.stringify(error));            
                this.errorMessage = JSON.stringify(error);
            });
            ////SHOW DEFAULT VALUES IN BCC////
            
    }    
    //Email Template Select List handler
    handleEmailTemplate(event)
    {
        //emailTemplateData
        this.loadingSpinner=true;
        //console.log("defaultQuoteType=="+this.defaultQuoteType);
        //console.log("this.selectedTemplate==="+event.detail.value+"=this.recordId=="+this.recordId);
        if(event.detail.value && this.recordId)
        {
            emailTemplateData({templateId:event.detail.value,quoteId:this.recordId})
            .then(result => {         
                //console.log('quoteNotes=='+result);  
                //console.log('quoteNotes=='+JSON.stringify(result[0]));            
                this.emailBody = result[0].emailBody;
                this.emailSubject = result[0].emailSubject;
                this.loadingSpinner=false;
             })
            .catch(error => {
                this.loadingSpinner=false;
                console.log('error quotenotes=='+error);            
                //this.errorMessage = JSON.stringify(error);
            });
        }                
    }

    handleQuoteTypeChange(event)
    {
        this.selectedQuoteType = event.detail.value;
        this.selectedQuoteTypeLabel = event.target.options.find(opt => opt.value === event.detail.value).label;
        console.log(event.detail.value+'=='+this.selectedQuoteType);
    }
    handleDefaultPicklist(event)
    {        
        //console.log("selected=="+event.detail.value);        
        if(event.detail.value)
        {            
            this.selecteddefaultTyeps = event.detail.value;
        }        
        //console.log("this.selecteddefaultTyeps=="+this.selecteddefaultTyeps);
    }
    //Function to get documents from the server (SOAP Callout through APEX Method)
    getFilesFromServer(event)//Next button
    {
        this.loadingSpinner=true;
        console.log('handleDefaultPicklist=='+this.selectedQuoteType);
        console.log('selectedAttachmentType=='+this.attachmentType);
        if(this.selectedQuoteType)
        {
            fetchQuoteDocsFromServer({defaultQuoteType:this.selecteddefaultTyeps,
                dwnType:this.attachmentType,
                selectedQuoteType:this.selectedQuoteType,
                selectedQuoteTypeLabel:this.selectedQuoteTypeLabel,
                quoteId:this.recordId
            })
            .then(result => {         
                this.emailAttachmentsList = result;
                console.log('quoteNotes=='+result);  
                console.log('quoteNotes=='+JSON.stringify(result));            
                this.loadingSpinner=false;
                this.showSendEmail = true;
                this.showNext=false;
                if(result)
                {
                    this.processResultInEmailContent(result);
                }                
                //this.emailBody = result[0].emailBody;
                //this.emailSubject = result[0].emailSubject;
             })
            .catch(error => {
                this.loadingSpinner=false;
                this.showSendEmail = false;
                this.showNext=true;
                console.log('error quotenotes=='+error);            
                console.log('error quotenotes=='+JSON.stringify(error));            
                this.errorMessage = error.errorMessage;
                //this.errorMessage = JSON.stringify(error);
            });            
        }
    }
    //Function to process result from Callout and update Email Body with the file names/links
    processResultInEmailContent(result)
    {
        const res = result;
        var fileNames='';
        var attType = this.attachmentType;
        res.forEach(function (arrayItem) {            
            if(attType=='ATT' && arrayItem.docName){                               
                fileNames = fileNames.concat('<br>'+arrayItem.docName);                
            }
        else if(attType=='URL' && arrayItem.hrefUrl)
            {
                fileNames = fileNames.concat('<br>'+arrayItem.hrefUrl);                
            }
        });                                                                                                             
        console.log('fileNames='+fileNames);
        if(this.emailBody)
        {            
            this.emailBody = this.emailBody+'<br/>'+fileNames;
        }
        else
        {
            this.emailBody = fileNames;
        }
    }
    //Function to send email - using Apex Method - START
    sendEmail(event)
    {
        this.showNext=false;
        //this.loadingSpinner=true;
        var emailAttachURLs = [];
        if(this.emailAttachmentsList)
        {
            const emailAtts = this.emailAttachmentsList;        
            emailAtts.forEach(function (arrayItem) {
                console.log('arrayItem=='+arrayItem.docId);
                if(arrayItem.docId){
                    console.log('in loop');                
                    emailAttachURLs = [ ...emailAttachURLs, arrayItem.docId ];                
                }
            }); 
        }
                                                                                                                    
        //Call Apec Send email
        //Get to EmailIds
        //const tovals = this.template.querySelector('[data-element="tocomponent"]').selectedValues;
        //console.log('tovals='+tovals+'=='+JSON.stringify(tovals));
        console.log('this.sele='+this.selectedRecipients+'=='+JSON.stringify(this.selectedRecipients));
        console.log('this.sele='+this.selectedCcRecipients+'=='+JSON.stringify(this.selectedCcRecipients));
        //console.log('subject:this.emailSubject=='+this.emailSubject);
        console.log('selEmailConList='+this.selEmailConList+'=='+JSON.stringify(this.selEmailConList));
        //IF User dont select anything then making th
        //Merge Recipients based on default recipients END
        sendEmail({
            toAddress:this.selectedRecipients,
            ccAddress:this.selectedCcRecipients,
            bccAddress:this.selectedBccRecipients,
            emailSubject:this.emailSubject,
            emailBody:this.emailBody,
            attachments:emailAttachURLs,
            toAddressConIds:this.selEmailConList,
            quoteId:this.recordId  
        })
        .then(result => {         
            console.log('emailll=='+result);  
            console.log('emaill..string=='+JSON.stringify(result));            
            if(result=='success')
            {
                this.showToastMessage('Success','Email has been sent','success');
                this.loadingSpinner=false;                
                this.redirectToQuote();
            }
            else
            {
                this.loadingSpinner=false;
                this.errorMessage = result;
            }
        })
        .catch(error => {
            this.loadingSpinner=false;
            console.log('error email=='+error);            
            console.log('error email..string=='+JSON.stringify(error));                        
            //this.errorMessage = JSON.stringify(error);
        });            
    }
    //Function to send email - using Apex Method - END
    //Function to showtoast message
    showToastMessage(titleMsg, message, varnt)
    {
        const event = new ShowToastEvent({
            title: titleMsg,
            message: message,
            variant: varnt,
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }
    //Used in Cancel button and after success of send email 
    redirectToQuote()
    {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                objectApiName: 'Quotes__c',
                actionName: 'view',
                recordId: this.recordId
            }
        });       
    }
}