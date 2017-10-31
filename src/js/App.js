'use strict';

var $ = window.$;
var _ = window._;
var Backbone = window.Backbone;
var MapView = window.MapView;
var RegionListView = window.RegionListView;
var RegionDetailsView = window.RegionDetailsView;

window.App = Backbone.View.extend({
    initialize: function() {
        this.mapView = null;
        this.regionListView = null;
        this.regionDetailsView = null;
        this.$statsRegion = $('.stats');

        this.emptyDetailsView = this.emptyDetailsView.bind(this);
        this.fadeInListView = this.fadeInListView.bind(this);
        this.toggleDetails = this.toggleDetails.bind(this);
        this.slideOutStatsRegion = _.once(this.slideOutStatsRegion).bind(this);

        this.listenTo(this.model, 'change:detailsVisible', this.toggleDetails);
        this.listenToOnce(this.model, 'change:regionList', this.createRegionList);
        this.listenToOnce(this.model, 'change:baseMapTilesUrl', this.createMapView);
        this.listenToOnce(this.model, 'change:detailsVisible', this.slideOutStatsRegion);

        this.model.fetch();
        this.render();
    },

    render: function() {
        return this;
    },

    createMapView: function() {
        this.mapView = new MapView({
            model: this.model,
            slideOutStatsRegion: this.slideOutStatsRegion,
        });
        this.mapView.render();
    },

    createRegionList: function() {
        this.regionListView = new RegionListView({ model: this.model });
        this.regionListView.render();
    },

    emptyDetailsView: function() {
        this.regionDetailsView.$el.empty();
    },

    fadeInListView: function() {
        this.regionListView.$el.fadeIn(200);
    },

    toggleDetails: function() {
        if (this.model.get('detailsVisible')) {
            this.regionListView.$el.hide();
            this.regionDetailsView = new RegionDetailsView({
                model: this.model.get('selectedRegion'),
                hideDetails: this.model.hideDetails,
            });
            this.regionDetailsView.render();
            this.regionDetailsView.$el.show();
        } else {
            this.regionDetailsView.$el.fadeOut(200);
            _.delay(this.emptyDetailsView, 200);
            _.delay(this.fadeInListView, 200);
        }
    },

    slideOutStatsRegion: function() {
        var $statsRegion = this.$statsRegion;
        var model = this.model;

        if ($statsRegion && this.mapView.$el) {
            $statsRegion.addClass('slideout');
            this.mapView.$el.addClass('full-height');
            _.delay(function() {
                $statsRegion.hide();
                model.set('statsVisible', false);
            }, 500);
        }
    }
});
