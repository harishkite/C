import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
export default class ContactNewOverrideLwc extends NavigationMixin(LightningElement){
    connectedCallback(){
        let temp = {
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Contact',
                actionName: 'new'                
            },
            state : {
                //nooverride: '1',
                defaultFieldValues: "FirstName=Test"
                //defaultFieldValues:"Name=Salesforce,AccountNumber=A1,AnnualRevenue=37000,Phone=7055617159"
            }
        };
        this[NavigationMixin.Navigate](temp);
    }
}