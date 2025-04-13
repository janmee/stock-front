<template>
  <div class="realtime-regression">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>实时回归测试</span>
      </div>
      
      <el-form :model="form" label-width="120px">
        <el-form-item label="股票代码">
          <el-input v-model="form.stockCode" placeholder="请输入股票代码"></el-input>
        </el-form-item>
        
        <el-form-item label="卖出利润百分比">
          <el-input-number 
            v-model="form.sellProfitPercentage" 
            :min="0" 
            :max="100"
            :step="0.1"
            :precision="1">
          </el-input-number>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="runRegression">开始回测</el-button>
        </el-form-item>
      </el-form>
      
      <div v-if="result.trades && result.trades.length > 0">
        <h3>交易记录</h3>
        <el-table :data="result.trades" style="width: 100%">
          <el-table-column prop="time" label="时间" width="180"></el-table-column>
          <el-table-column prop="type" label="类型" width="100"></el-table-column>
          <el-table-column prop="price" label="价格"></el-table-column>
          <el-table-column prop="quantity" label="数量"></el-table-column>
          <el-table-column prop="profit" label="利润"></el-table-column>
        </el-table>
        
        <h3>性能指标</h3>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="总收益率">
            {{ result.performance.totalReturn }}%
          </el-descriptions-item>
          <el-descriptions-item label="年化收益率">
            {{ result.performance.annualReturn }}%
          </el-descriptions-item>
          <el-descriptions-item label="最大回撤">
            {{ result.performance.maxDrawdown }}%
          </el-descriptions-item>
          <el-descriptions-item label="夏普比率">
            {{ result.performance.sharpeRatio }}
          </el-descriptions-item>
          <el-descriptions-item label="胜率">
            {{ result.performance.winRate }}%
          </el-descriptions-item>
          <el-descriptions-item label="盈亏比">
            {{ result.performance.profitLossRatio }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'RealtimeRegression',
  data() {
    return {
      form: {
        stockCode: '',
        sellProfitPercentage: 5.0
      },
      result: {
        trades: [],
        performance: {}
      }
    }
  },
  methods: {
    async runRegression() {
      try {
        const response = await axios.post('/api/backtest/realtime-regression', this.form)
        if (response.data.success) {
          this.result = response.data
        } else {
          this.$message.error(response.data.error || '回测失败')
        }
      } catch (error) {
        this.$message.error('系统错误：' + error.message)
      }
    }
  }
}
</script>

<style scoped>
.realtime-regression {
  padding: 20px;
}
.box-card {
  margin-bottom: 20px;
}
</style> 