import { LightningElement,track,api ,wire } from 'lwc';
import retrieveRecords from '@salesforce/apex/customMultiSelectLookupCtrl.retrieveRecords';

let i=0;
export default class customMultiSelectLookup extends LightningElement {
    @api defaultShowValues;
    @track itemMap = new Map();//Map to store SObject data apart from Label and Value
    @api selectedValues;
    
    @api setDefaultShowValues(args,idEmailMap)
    {
        console.log('in it');
        console.log('args=='+JSON.stringify(idEmailMap));
        var emailMap = new Map();
        if(idEmailMap)
        {
            idEmailMap.forEach(function(value, key) {
                console.log(key+'=='+value);
                emailMap.set(key,value);
            });
            this.itemMap = emailMap;
        }
        this.defaultShowValues = args;
        //var vals = [...idEmailMap.values()];
        //this.selectedValues = [...idEmailMap.values()];//vals;
        //console.log('this.selectedValues=map-values-'+this.selectedValues+'=='+JSON.stringify(this.selectedValues));
        //console.log('defaultShowValues=='+this.defaultShowValues+'='+JSON.stringify(this.defaultShowValues));
        this.globalSelectedItems = this.defaultShowValues;

    }
    @track globalSelectedItems = []; //holds all the selected checkbox items
    //start: following parameters to be passed from calling component
    @api labelName;
    @api objectApiName; // = 'Contact';
    @api fieldApiNames; // = 'Id,Name';
    @api filterFieldApiName;    // = 'Name';
    @api iconName;  // = 'standard:contact';
    //end---->
    @track items = []; //holds all records retrieving from database
    @track selectedItems = []; //holds only selected checkbox items that is being displayed based on search    
    //since values on checkbox deselection is difficult to track, so workaround to store previous values.
    //clicking on Done button, first previousSelectedItems items to be deleted and then selectedItems to be added into globalSelectedItems
    @track previousSelectedItems = []; 
    @track value = []; //this holds checkbox values (Ids) which will be shown as selected
    searchInput ='';    //captures the text to be searched from user input
    isDialogDisplay = false; //based on this flag dialog box will be displayed with checkbox items
    isDisplayMessage = false; //to show 'No records found' message
    
    //When User just focus on input box we will show the default values
    @api showOnFocus=false;
    @api showDefaultRecords;
    handleOnFocus()
    {
        if(this.showOnFocus)
        {
            console.log('in showonfocus if is true=='+this.showDefaultRecords);
            const searchEv = new CustomEvent("abc",{detail:this.showDefaultRecords});
            this.onchangeSearchInput(searchEv);
        }
    }
    /////SHOW DEFAULT VALUES START////////
    
    constructor()
    {
        super();
    }
    renderedCallback()
    {
        //console.log('in lookup comp - renderedcall-='+this.defaultShowValues+'='+JSON.stringify(this.defaultShowValues));
    }
    connectedCallback()
    {
        //console.log('in lookup comp - conntectedcallback-='+this.defaultShowValues+'='+JSON.stringify(this.defaultShowValues));
        //this.globalSelectedItems = this.defaultShowValues;
    }
    /////SHOW DEFAULT VALUES END//////////
    //This method is called when user enters search input. It displays the data from database.
    onchangeSearchInput(event){
        //console.log("onchange search=="+event.detail.value);
        console.log('new one='+event.detail);
        if(event.target)
        {
            this.searchInput = event.target.value;        
        }
        if(this.searchInput.trim().length>0 || event.detail){
            //retrieve records based on search input
            retrieveRecords({objectName: this.objectApiName,
                            fieldAPINames: this.fieldApiNames,
                            filterFieldAPIName: this.filterFieldApiName,
                            strInput: this.searchInput,
                            filterInFieldAPIName:'Id',
                            filterInStrings:event.detail
                            })
            .then(result=>{ 
                this.items = []; //initialize the array before assigning values coming from apex
                this.value = [];
                this.previousSelectedItems = [];
        
                if(result.length>0){
                    //console.log('result=='+JSON.stringify(result));
                    result.map(resElement=>{                        
                        //prepare items array using spread operator which will be used as checkbox options
                        this.items = [...this.items,{value:resElement.Id, 
                                                    label:resElement.Name}];                        
                        /*since previously choosen items to be retained, so create value array for checkbox group.
                            This value will be directly assigned as checkbox value & will be displayed as checked.
                        */
                        //this.itemMap.set(resElement.Id,resElement.Email);
                        //console.log('!this.itemMap.has(resElement.Id)=='+this.itemMap.has(resElement.Id)+'=='+resElement.Email);
                        if(resElement.Email)
                        {
                            //console.log('IN IF');
                            this.itemMap.set(resElement.Id,resElement.Email);
                            //this.itemMap1.set(resElement.Id,resElement.Email);
                            //console.log('==this.itemMap=='+JSON.stringify(this.itemMap));
                        }
                        //console.log('=='+this.itemMap);
                        //console.log('=stringify='+JSON.stringify(this.itemMap));
                        
                        this.globalSelectedItems.map(element =>{
                            if(element.value == resElement.Id){
                                this.value.push(element.value);
                                this.previousSelectedItems.push(element);                      
                            }
                        });
                    });
                    
                    this.isDialogDisplay = true; //display dialog
                    this.isDisplayMessage = false;
                }
                else{
                    //display No records found message
                    this.isDialogDisplay = false;
                    this.isDisplayMessage = true;                    
                }
            })
            .catch(error=>{
                this.error = error;
                this.items = undefined;
                this.isDialogDisplay = false;
            })
        }else{
            this.isDialogDisplay = false;
        }                
    }

    //This method is called during checkbox value change
    handleCheckboxChange(event){
        let selectItemTemp = event.detail.value;        
        //all the chosen checkbox items will come as follows: selectItemTemp=0032v00002x7UE9AAM,0032v00002x7UEHAA2
        console.log(' handleCheckboxChange  value=', event.detail.value);        
        this.selectedItems = []; //it will hold only newly selected checkbox items.        
        
        /* find the value in items array which has been prepared during database call
           and push the key/value inside selectedItems array           
        */
        selectItemTemp.map(p=>{            
            if(this.itemMap.has(p))
            {
                console.log('Email=='+this.itemMap.get(p));
            }
            let arr = this.items.find(element => element.value == p);
            //arr = value: "0032v00002x7UEHAA2", label: "Arthur Song
            if(arr != undefined){
                this.selectedItems.push(arr);
            }  
        });     
    }

    //this method removes the pill item
    handleRemoveRecord(event){        
        const removeItem = event.target.dataset.item; //"0032v00002x7UEHAA2"
        
        //this will prepare globalSelectedItems array excluding the item to be removed.
        this.globalSelectedItems = this.globalSelectedItems.filter(item => item.value  != removeItem);
        const arrItems = this.globalSelectedItems;

        //initialize values again
        this.initializeValues();
        this.value =[]; 

        //propagate event to parent component
        const evtCustomEvent = new CustomEvent('remove', {   
            detail: {removeItem,arrItems}
            });
        this.dispatchEvent(evtCustomEvent);
    }
    
    //Done dialog button click event prepares globalSelectedItems which is used to display pills
    handleDoneClick(event){
        //remove previous selected items first as there could be changes in checkbox selection
        this.previousSelectedItems.map(p=>{
            this.globalSelectedItems = this.globalSelectedItems.filter(item => item.value != p.value);
        });
        
        //now add newly selected items to the globalSelectedItems
        this.globalSelectedItems.push(...this.selectedItems);        
        const arrItems = this.globalSelectedItems;
        const itemDetailMap = this.itemMap;
        var dataMap = [];
        //store current selection as previousSelectionItems
        this.previousSelectedItems = this.selectedItems;
        this.initializeValues();
        console.log('globalSelectedItems=='+this.globalSelectedItems+'=='+JSON.stringify(this.globalSelectedItems));
        console.log('dataMap=='+JSON.stringify(itemDetailMap));
        //console.log('arrItems=='+JSON.stringify(arrItems));
        //Getting selected values data from itemMap
        arrItems.forEach(function (arrayItem) {
            console.log('arrayItem=='+arrayItem.value);
            if(arrayItem.value && itemDetailMap ){
                console.log('in loop');
                if(itemDetailMap.has(arrayItem.value))
                {
                    dataMap = [ ...dataMap, itemDetailMap.get(arrayItem.value) ];
                }            
            }
        });
        /*if(this.selectedValues)
        {
            this.selectedValues = this.selectedValues.concat(dataMap);
            console.log('after concat=='+this.selectedValues+'=='+JSON.stringify(this.selectedValues));
        }*/
        
        //console.log('dataMap=selectedValues=sending=='+selectedValues+'=='+JSON.stringify(this.selectedValues));
        //propagate event to parent component
        const evtCustomEvent = new CustomEvent('retrieve', { 
            detail: {arrItems,dataMap}
            });
        this.dispatchEvent(evtCustomEvent);
    }

    //Cancel button click hides the dialog
    handleCancelClick(event){
        this.initializeValues();
    }

    //this method initializes values after performing operations
    initializeValues(){
        this.searchInput = '';        
        this.isDialogDisplay = false;
    }
}