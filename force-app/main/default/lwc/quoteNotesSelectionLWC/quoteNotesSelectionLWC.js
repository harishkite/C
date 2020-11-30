//import { LightningElement } from 'lwc';
import { LightningElement,track,api ,wire } from 'lwc';
import quoteNotes from '@salesforce/apex/quoteLightningUtility.quoteNotesList';
import Save_Notes from '@salesforce/label/c.Save_Notes';
import Code from '@salesforce/label/c.Code';
import Close from '@salesforce/label/c.Close';
import Description from '@salesforce/label/c.Description';
Description
export default class QuoteNotesSelectionLWC extends LightningElement {
    columns = [
        { label: 'Code', fieldName: 'code' },
        { label: 'Description', fieldName: 'description' },       
    ];   
    labels = {Close,Save_Notes,Code,Description};
    //quoteNotesSelectionData = []; 
    @api profilename;
    @api productid;
    @api notesvalue;
    @api notetable;
    @track selection;
    @api selectednotes()
    {
        this.template.querySelectorAll('[data-element="notes-checkbox"]')
        .forEach(element => { 
            if(element.checked)
            {
                if(element.value!=null && element.value!='undefined' && element.value!='')
                {
                    if(this.selection!=null && this.selection!='undefined' && this.selection!='')
                    {
                        //console.log('IN IF--'+this.selection);
                        this.selection = this.selection +', '+element.value;
                    }
                    else
                    {
                        //console.log('IN ELSE--'+this.selection);
                        this.selection = element.value;
                    }
                }                                                
            }           
        });
        var retObj = {
            notetablename: this.notetable,
            selectednotes: this.selection
        };
        //console.log('selection=='+this.selection);
        return retObj;
    }
    @track quoteNotesSelectionData=[];
    //@wire(quoteNotes, {notevalue:'$notesvalue', profileName:'$profileName', notetable:'$notetable', productid: '$productid',FREgn:'null'}) quoteNotesSelectionData; 
    //@wire(quoteNotes, {csOppId:'$oppId'}) quoteNotesData(result,error){        
    /*@wire(quoteNotes, {notevalue:'$notesvalue', profileName:'$profileName', notetable:'$notetable', productid: '$productid',FREgn:'null'}) 
    quoteNotesData({data,error}){        
        console.log('result of quotenotes==WIRE='+data);
        console.log('result of quotenotes==WIRE='+JSON.stringify(data));
        if(data)
        {
            console.log('result=='+data);
            this.quoteNotesSelectionData = data;
        }
        else if(error)
        {
            console.log('error in quotenotes=='+error);
            console.log('error in quotenotes=stringify='+JSON.stringify(error));
        }
    }*/
    constructor()
    {
        super();
    }
    connectedCallback()
    {
        console.log('quotenotes=='+this.profilename+'=='+this.notetable+'=='+this.notesvalue+'=='+this.productid);                
        quoteNotes({notevalue:this.notesvalue, profileName:this.profilename, notetable:this.notetable, productid: this.productid,FREgn:'null'})
            .then(result => {         
                //console.log('quoteNotes=='+result);  
                this.quoteNotesSelectionData=result;
                //this.fillNotesValue(this.notesvalue);
                //console.log('quoteNotes=='+JSON.stringify(result));            
             })
            .catch(error => {
                console.log('error quotenotes=='+error);            
                //this.errorMessage = JSON.stringify(error);
            });
    }
    renderedCallback()
    {
        this.fillNotesValue(this.notesvalue);
    }
    fillNotesValue(notesvalue)
    {
        if(notesvalue!=null && notesvalue!='' && notesvalue!='undefined')
        {            
            //console.log('IN fill notes'+notesvalue);
            //console.log('-=-='+JSON.stringify(this.template.querySelectorAll('[data-element="notes-checkbox"]')));
            this.template.querySelectorAll('[data-element="notes-checkbox"]')
            .forEach(element => { 
                //console.log('element=='+element.value);
                if(element.value!=null && element.value!='undefined' && element.value!='')
                {
                    //console.log('IN fill notes for each if');
                    if(notesvalue.indexOf(element.value)>-1)
                    {
                        element.checked=true;
                    }
                }
            });
        }
    }
}