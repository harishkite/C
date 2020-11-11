import { LightningElement,track,api ,wire} from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getContacts from '@salesforce/apex/AccountController.getContacts';
import { NavigationMixin } from 'lightning/navigation';

let i=0;


export default class CreateRelatedAccount extends NavigationMixin(LightningElement) {
    @api recordId;
    @api ConId;
    @track cardTitle='New Related Account';

    @track error;   //this holds errors

    @track items = []; //this holds the array for records with value & label

    @track value = '';  //this displays selected value of combo box
    searchKey = '';
    handleSuccess (){
        const evt = new ShowToastEvent({
            title: "Success!",
            message: "The Related account record has been successfully saved.",
            variant: "success",
        });
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: 'Project__c',
                actionName: 'view'
            },
        });
        this.dispatchEvent(evt);
    }
    /* Load Contacts based on AccountId from Controller */
     @wire(getContacts, { accountId: '$searchKey'})
     wiredContacts({ error, data }) {
         if (data) {
             for(i=0; i<data.length; i++) {
                 console.log('Contact ids=' + data[i].Id);
                 this.items = [...this.items ,{value: data[i].Id , label: data[i].Name}];                                   
             }                
             this.error = undefined;
         } else if (error) {
             this.error = error;
             this.contacts = undefined;
         }
     }
     ACChandleChange(event) {
        console.log("You selected an account: " + event.detail.value[0]);
        const searchKey = event.target.value;
       this.searchKey = searchKey;
     }
     //getter property from statusOptions which return the items array
    get statusOptions() {
        console.log(this.items);
        return this.items;
    }
    handleChange(event) {
        // Get the string of the "value" attribute on the selected option
        const selectedOption = event.detail.value;
        this.ConId=selectedOption;
        console.log('selectedOption=' + selectedOption);
    }
  
}