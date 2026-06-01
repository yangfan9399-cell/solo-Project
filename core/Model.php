<?php

class Model {
    protected $table;
    protected $primaryKey = 'id';
    protected $fillable = [];
    protected $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function all() {
        return $this->db->fetchAll("SELECT * FROM {$this->table} ORDER BY {$this->primaryKey} DESC");
    }

    public function find($id) {
        return $this->db->fetchOne("SELECT * FROM {$this->table} WHERE {$this->primaryKey} = ?", [$id]);
    }

    public function where($column, $value, $operator = '=') {
        return $this->db->fetchAll("SELECT * FROM {$this->table} WHERE {$column} {$operator} ?", [$value]);
    }

    public function findOneWhere($column, $value, $operator = '=') {
        return $this->db->fetchOne("SELECT * FROM {$this->table} WHERE {$column} {$operator} ?", [$value]);
    }

    public function create($data) {
        $fillableData = array_intersect_key($data, array_flip($this->fillable));
        return $this->db->insert($this->table, $fillableData);
    }

    public function update($id, $data) {
        $fillableData = array_intersect_key($data, array_flip($this->fillable));
        $this->db->update($this->table, $fillableData, "{$this->primaryKey} = :id", ['id' => $id]);
        return $this->find($id);
    }

    public function delete($id) {
        return $this->db->delete($this->table, "{$this->primaryKey} = ?", [$id]);
    }

    public function paginate($page = 1, $perPage = 10) {
        $offset = ($page - 1) * $perPage;
        $total = $this->db->fetchOne("SELECT COUNT(*) as total FROM {$this->table}")['total'];
        $items = $this->db->fetchAll("SELECT * FROM {$this->table} ORDER BY {$this->primaryKey} DESC LIMIT ? OFFSET ?", [$perPage, $offset]);
        
        return [
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'perPage' => $perPage,
            'totalPages' => ceil($total / $perPage)
        ];
    }
}
