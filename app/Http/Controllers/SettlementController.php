<?php

require_once ROOT_PATH . '/core/Controller.php';
require_once ROOT_PATH . '/app/Models/Settlement.php';
require_once ROOT_PATH . '/app/Models/Subsidy.php';
require_once ROOT_PATH . '/app/Models/Booking.php';
require_once ROOT_PATH . '/app/Models/User.php';

class SettlementController extends Controller {
    public function index() {
        Auth::requireAuth();
        $model = new Settlement();
        $settlements = $model->all();
        
        $subsidyModel = new Subsidy();
        $subsidies = [];
        foreach ($subsidyModel->all() as $s) {
            $subsidies[$s['id']] = $s;
        }
        
        $this->view('settlements/index', [
            'settlements' => $settlements,
            'subsidies' => $subsidies,
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

    public function generateSettlement($subsidyId) {
        Auth::requireAuth();
        
        $subsidyModel = new Subsidy();
        $subsidy = $subsidyModel->find($subsidyId);
        
        if (!$subsidy) {
            $this->with('error', '油补核算记录不存在')->redirect('/subsidies');
        }
        
        $existingSettlement = new Settlement();
        $duplicate = $existingSettlement->findOneWhere('subsidy_id', $subsidyId);
        if ($duplicate) {
            $this->with('error', '该油补记录已生成结算单 ' . $duplicate['settlement_no'])->redirect('/subsidies/' . $subsidyId);
        }
        
        $calculated = Settlement::calculate($subsidyId);
        
        $data = array_merge($calculated, [
            'settlement_no' => Settlement::generateSettlementNo(),
            'subsidy_id' => $subsidyId,
            'status' => 'unpaid',
            'notes' => '由油补核算 ' . $subsidy['subsidy_no'] . ' 自动生成',
        ]);
        
        $model = new Settlement();
        $settlementId = $model->create($data);
        
        $this->with('success', '结算单已生成')->redirect('/settlements/' . $settlementId);
    }
}
