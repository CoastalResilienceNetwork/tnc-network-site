'use strict';

var Backbone = window.Backbone;

window.SubregionDetailsModel = Backbone.Model.extend({
    defaults: {
        title: null,
        description: null,
        mapUrl: null,
        image: null,
        selected: false,
    },
});

window.SubregionsCollection = Backbone.Collection.extend({
    model: window.SubregionDetailsModel
});

window.RegionDetailsModel = Backbone.Model.extend({
    defaults: {
        title: null,
        description: null,
        image: null,
        subregions: null,
        selected: false
    },

    initialize: function() {
        this.set('subregions', new window.SubregionsCollection(this.get('subregions')));
    }
});

window.RegionsCollection = Backbone.Collection.extend({
    model: window.RegionDetailsModel
});

window.AppModel = Backbone.Model.extend({
    url: 'config.json',

    defaults: {
        statsList: null,
        partnerModalLinks: null,
        initialMapCenter: null,
        initialMapZoom: null,
        baseMapTilesMinZoom: null,
        baseMapTilesMaxZoom: null,
        baseMapTilesUrl: null,
        baseMapTilesAttribution: null,
        regionList: null,
        regionLayerUrl: null,
        regionLayerOpacity: null,
    },

    getSelectedRegion: function() {
        return this.get('regionList')
            .filter({ selected: true })[0];
    },

    getSelectedSubregion: function() {
        var selectedRegion = this.getSelectedRegion();

        if (selectedRegion) {
            return selectedRegion.get('subregions')
                .filter({ selected: true })[0];
        }

        return null;
    }
});
