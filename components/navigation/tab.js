import _ from '../../utils/index'

Component({
  properties:{
    tabNames:{
      type: Array,
      value:[]
    },
    activeIndex: {
      type: Number,
      value: 0,
    },
    position: {
      type: String,
      value: 'fixed',
    },
    top: {
      type: String,
      value: '0',
    },
    zIndex: {
      type: String,
      value: '1',
    }
  },
  methods:{
    tapTab(e) {
      const index = _.get(e, 'currentTarget.dataset.index', 0)
      if (index !== this.data.activeIndex) {
        this.triggerEvent('change', { current: index })
      }
    }
  }
})
