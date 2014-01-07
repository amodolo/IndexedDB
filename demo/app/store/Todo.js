Ext.define('Demo.store.Todo',{
	extend: 'Ext.data.Store',
    requires:['Demo.model.Todo'],

	config: {
		storeId:'todo',
		model: 'Demo.model.Todo',
		autoLoad: true
	}
});