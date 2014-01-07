Ext.define('Demo.model.Todo', {
    extend: 'Ext.data.Model',
    requires:['Lib.data.proxy.IndexedDB'],
    
    config: {
        fields: [
            { name: 'text', type: 'string' }
        ],
        proxy:{
            type:'indexeddb'
        }
    }    
});