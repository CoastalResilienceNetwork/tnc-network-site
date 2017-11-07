'use strict';

var _ = window._;
var Backbone = window.Backbone;

var RegionDetailsModel = Backbone.Model.extend({
    defaults: {
        title: null,
        description: null,
        mapUrl: null,
        image: null,
        subregions: null,
    },
});

window.AppModel = Backbone.Model.extend({
    url: 'config.json',

    defaults: {
        statsVisible: true,
        detailsVisible: false,
        selectedRegion: null,
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

    initialize: function() {
        this.hideDetails = this.hideDetails.bind(this);
        this.showDetails = this.showDetails.bind(this);
    },

    hideDetails: function() {
        this.set({
            detailsVisible: false,
            selectedRegion: null,
        });
        return _.noop;
    },

    showDetails: function(regionName) {
        var selectedRegion = null;

        if (!regionName) {
            return _.noop;
        }

        selectedRegion = _.findWhere(this.get('regionList'), { title: regionName });

        if (!selectedRegion) {
            return _.noop;
        }

        this.set({
            selectedRegion: new RegionDetailsModel(selectedRegion),
            detailsVisible: true,
        });

        return _.noop;
    },
});
