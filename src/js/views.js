'use strict';

var $ = window.$;
var L = window.L;
var _ = window._;
var Backbone = window.Backbone;

window.MapView = Backbone.View.extend({
    el: '#map',

    initialize: function(options) {
        this.map = null;
        this.slideOutStatsRegion = options.slideOutStatsRegion;
        this.listenTo(this.model, 'change:selectedRegion', this.panBaseMap);
        this.listenToOnce(this.model, 'change:statsVisible', this.resetMapSize);
    },

    render: function() {
        var map = L.map('map', {
            center: this.model.get('initialMapCenter'),
            zoom: this.model.get('initialMapZoom'),
        });

        L.tileLayer(this.model.get('baseMapTilesUrl'), {
            attribution: this.model.get('baseMapTilesAttribution'),
            minZoom: this.model.get('baseMapTilesMinZoom'),
            maxZoom: this.model.get('baseMapTilesMaxZoom'),
            ext: 'png',
        }).addTo(map);

        L.esri.dynamicMapLayer({
            url: this.model.get('regionLayerUrl'),
            opacity: this.model.get('regionLayerOpacity'),
        }).addTo(map);

        this.map = map;
        this.map.once('moveend', this.slideOutStatsRegion);

        return this;
    },

    panBaseMap: function() {
        var newCenter = this.model.get('selectedRegion') ?
            this.model.get('selectedRegion').get('mapCenter') :
            this.model.get('initialMapCenter');

        var newZoom = this.model.get('selectedRegion') ?
            this.model.get('selectedRegion').get('mapZoom') :
            this.model.get('initialMapZoom');

        this.map.flyTo(newCenter, newZoom);
    },

    resetMapSize: function() {
        var animate = true;
        if (this.map) {
            this.map.invalidateSize(animate);
        }
    },
});

window.RegionListView = Backbone.View.extend({
    el: '#region-list-view',

    template: _.template($('#regionListTemplate').html()),

    events: {
        'click': 'handleSelection',
    },

    render: function() {
        this.$el.html(this.template({ regionList: this.model.get('regionList') }));
        return this;
    },

    handleSelection: function(e) {
        this.model.showDetails(e.target.id);
    },
});

window.RegionDetailsView = Backbone.View.extend({
    el: '#region-details-view',

    template: _.template($('#regionDetailsTemplate').html()),

    events: {
        'click #close-details-btn': 'closeDetails',
    },

    initialize: function(options) {
        this.hideDetails = options.hideDetails;
    },

    render: function() {
        this.$el.html(this.template({
            title: this.model.get('title'),
            description: this.model.get('description'),
            image: this.model.get('image'),
            mapUrl: this.model.get('mapUrl'),
            subregions: this.model.get('subregions'),
        }));

        return this;
    },

    closeDetails: function() {
        this.hideDetails();
    },
});
