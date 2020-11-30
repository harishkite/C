import { LightningElement, wire, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord } from 'lightning/uiRecordApi';
import QUOTEOBJECT from '@salesforce/schema/Quotes__c';
import { refreshApex } from '@salesforce/apex';
import repCustomerPicklist from '@salesforce/apex/quoteLightningUtility.repCustomerPicklistEntry';
//Importing custom labels
//import nonelabel from '@salesforce/label/ADS_Cranford_Poland_New_Quote_Creation_Error';
import none from '@salesforce/label/c.None';
import save from '@salesforce/label/c.Save';
import SELECT_REP_CUST_INFO_HEADER from '@salesforce/label/c.Select_Rep_and_Customer_Information';
import REP_INFO_HEADER from '@salesforce/label/c.Rep_Information';
import CUST_INFO_HEADER from '@salesforce/label/c.Customer_Information';
import QUOTE_UI_REP_CUST_EMPTY from '@salesforce/label/c.Quote_UI_message_Rep_Customer_Empty';
import Action from '@salesforce/label/c.Action';
import Delete_Row from '@salesforce/label/c.Delete_Row';
import Add_Rows from '@salesforce/label/c.Add_Rows';
//import repcustomerwarning from '@salesforce/label/c.Save';
export default class QuoteRepCustomerMultiSelection extends LightningElement {
    labels = {none,Delete_Row,Add_Rows,Action,save,SELECT_REP_CUST_INFO_HEADER,REP_INFO_HEADER,CUST_INFO_HEADER,QUOTE_UI_REP_CUST_EMPTY};

    /*---FOR ERROR MESSGAGE--START---*/
    isRepCustAvailable=true;
    /*get isRepCustAvailable()
    {
        if(this.repPicklist && this.custPicklist)
        {
            if(this.repPicklist.length>1 && this.custPicklist.length>1)
            {
                return true;
            }
        }
        return false;
    }*/


    @api multirepcust()
    {
        return this.itemList;
    }        
    @api oppId;
    @api operation;
    /*--Filling Rep and Customer Picklist data--START---*/
    @track repCustPicklistData;    
    @track repPicklist = [
        {label: this.labels.none, value: ""}
    ];
    @track custPicklist = [
        {label: this.labels.none, value: ""}
    ];
    @api selectedRepVal;
    @api selectedCustVal;
    @wire(repCustomerPicklist, {csOppId:'$oppId'}) repCustPicklistData11(result,error){        
        console.log('result of repcustpicklists==WIRE='+JSON.stringify(result));
        if(result.data)
        {
            this.repCustPicklistData = result.data;
            for(const list of result.data){
                if(list.isRepRole)
                {                
                    const repoption = {
                        label: list.picklistLabel,
                        value: list.picklistValue
                    };
                    // this.selectOptions.push(option);
                    this.repPicklist = [ ...this.repPicklist, repoption ];
                }
                else
                {
                    const custoption = {
                        label: list.picklistLabel,
                        value: list.picklistValue
                    };
                    // this.selectOptions.push(option);
                    this.custPicklist = [ ...this.custPicklist, custoption ];
                }
            }
        } 
        if(this.repPicklist && this.custPicklist)
        {
            if(this.repPicklist.length>1 && this.custPicklist.length>1)
            {
                this.isRepCustAvailable=true;
            }
            else
            {
                this.isRepCustAvailable=false;
            }
        }
        else
        {
            this.isRepCustAvailable=false;
        }        
    }
    /*--Filling Rep and Customer Picklist data--END---*/

    /*--COPY Operation logic START---*/
    @track keyIndex = 0;
    @track itemList = [{  "key": this.keyIndex, "repid":"","customerid":""} ];
    recordData = {  "key": "", "repid":"","customerid":""};
    @track repvalue;
    @track customervalue;       
    /*@track selectedOption;
    changeHandler(event) {
        console.log('New =='+JSON.stringify(event));
        console.log('New =='+JSON.stringify(event.target));
        console.log('New =='+JSON.stringify(event.target.name));
    const field = event.target.name;
    if (field === 'optionSelect') {
        this.selectedOption = event.target.value;
            alert("you have selected : "+this.selectedOption);
        } 
    }*/
    constructor()
    {
        super();
    }
    get isCopyOperation()
    {
        //console.log('this.oper==='+this.operation);
        if(this.operation=='Copy')
        {
            //console.log('isCopyOperation==IF');
            return true;
        }
        return false;
    }
    addRow(event) {
        event.preventDefault();
        ++this.keyIndex;
        this.recordData.key=this.keyIndex;
        //var newItem = [{ this.recordData }];
        //console.log('before--itemList=='+JSON.stringify(this.itemList));
        this.itemList.push(JSON.parse(JSON.stringify(this.recordData)));
        //console.log('after---itemList=='+JSON.stringify(this.itemList));
        /*this.recordData.key = this.keyIndex;
        this.itemList.push(JSON.parse(JSON.stringify(this.recordData)));
        console.log('this.itemList=='+JSON.stringify(this.itemList));*/
        this.onClickOfAddDeleteRows();
    }
    removeRow(event) {
        event.preventDefault();
        if (this.itemList.length >= 2) {
            this.itemList = this.itemList.filter(function (element) {
                return parseInt(element.key) !== parseInt(event.target.accessKey);
            });
        }        
        /*const index = event.target.value;
        this.itemList.splice(index, 1);*/
        //console.log('this.itemList=='+JSON.stringify(this.itemList));
    }
    /*---DISPATCHING EVENTS---Rep and Customer Selection to Quote Parent Page--START---*/
    repPicklistOnchange(event)
    {
        //console.log('SelectedRep=='+JSON.stringify(event.target));
        //console.log('SelectedRep=='+JSON.stringify(event.target.value));
        const selectEvent = new CustomEvent('selectrep', {
            detail: event.target.value
        });
        this.dispatchEvent(selectEvent);
        this.repvalue=event.target.value;
        //this.repvalue
    }    
    custPicklistOnchange(event)
    {
        //console.log('SelectedRep=='+JSON.stringify(event));
        const selectEvent = new CustomEvent('selectcustomer', {
            detail: event.target.value
        });
        console.log('Selected cust in child=='+event.target.value);
        this.dispatchEvent(selectEvent);
        this.customervalue=event.target.value;
    }
    selectrepcustcopy(event)
    {
        const selectEvent = new CustomEvent('selectrepcustcopy', {
            detail: this.itemList
        });
    }
    selectRepCopy(event)
    {
        //console.log('CopySelect=REP='+JSON.stringify(event.target.value)+'==INDEX is=='+JSON.stringify(event.target.dataset.id));        
        //console.log('=this.itemList=BEFORE=='+JSON.stringify(this.itemList));
        this.itemList[event.target.dataset.id].repid = event.target.value;        
    }
    selectCustCopy(event)
    {
        //console.log('CopySelect=CUST='+JSON.stringify(event.target.value)+'==INDEX is=='+JSON.stringify(event.target.dataset.id));        
        //console.log('=this.itemList=BEFORE=='+JSON.stringify(this.itemList));
        this.itemList[event.target.dataset.id].customerid = event.target.value;
    }
    /*---DISPATCHING EVENTS---Rep and Customer Selection to Quote Parent Page--END---*/
    connectedCallback()
    {
        //console.log('OppId in connectedcallback--'+this.oppId);
        //console.log('before Refresh=='+JSON.stringify(this.repCustPicklistData));
        //refreshApex(this.repCustPicklistData);
        //console.log('after Refresh=='+JSON.stringify(this.repCustPicklistData));
        //console.log('SelectedRep=='+this.selectedRepVal);
        //console.log('SelectedCust=='+this.selectedCustVal);
    }
    renderedCallback()
    {
        //console.log('OppId in renderedcallback--'+this.oppId);
        this.onClickOfAddDeleteRows();                
        
    }   
     
    get isFirstRow()
    {
        //console.log('this.key=='+this.keyIndex);
        if(this.keyIndex != 0)
        {
            //console.log('IN IF--this.key=='+this.keyIndex);
            return true;
        }
        return false;
    }
    onClickOfAddDeleteRows()
    {
        var firstIcon = this.template.querySelector('lightning-icon');
        if(this.operation=='Copy')
        {
            console.log('templateSelector=='+JSON.stringify(this.template.querySelector('lightning-icon[accesskey="0"]')));
            if(this.template.querySelector('lightning-icon[accesskey="0"]'))
            {
                this.template.querySelector('lightning-icon[accesskey="0"]').className='slds-hide';    
            }
        }        
    }
    /*--COPY Operation logic END---*/
}