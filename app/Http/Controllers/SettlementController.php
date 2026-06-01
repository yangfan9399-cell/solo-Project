<?php

require_once ROOT_PATH . '/core/Controller.php';
require_once ROOT_PATH . '/app/Models/Settlement.php';
require_once ROOT_PATH . '/app/Models/Subsidy.php';
require_once ROOT_PATH . '/app/Models/User.php';

class SettlementController extends Controller {
    public function index() {
        Auth::requireAuth();
        $model = new Settlement();
        $settlements = $model->all();
        
        $this->view('settlements/index', [
            'settlements' => $settlements,
        ]);
    }

    public function show($id) {
        Auth::requireAuth();
        $model = new Settlement();
        $settlement = $model->find($id);
        
        if (!$settlement) {
            $this->with('error', '结算记录不存在')->redirect('/settlements');
        }
        
        $subsidyModel = new Subsidy();
        $subsidy = !empty($settlement['subsidy_id']) ? ($subsidyModel->find($settlement['subsidy_id']) ?: null) : null;
        
        $this->view('settlements/show', [
            'settlement' => $settlement,
            'subsidy' => $subsidy,
        ]);
    }

    public function pay($id) {
        Auth::requireAuth();
        $model = new Settlement();
        $settlement = $model->find($id);
        
        if (!$settlement) {
            $this->with('error', '结算记录不存在')->redirect('/settlements');
        }
        
        $model->update($id, [
            'status' => 'paid',
            'paid_at' => date('Y-m-d H:i:s'),
            'payment_method' => $_POST['payment_method'],
            'transaction_no' => $_POST['transaction_no'],
        ]);
        
        $this->with('success', '支付成功')->redirect('/settlements/' . $id);
    }
}
